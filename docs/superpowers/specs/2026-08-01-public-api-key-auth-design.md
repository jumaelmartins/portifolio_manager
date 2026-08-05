# Public API Key Authentication — Design

**Date:** 2026-08-01
**Status:** Draft (awaiting review)
**Depends on:** Public API scope A (CORS) + scope B (rate-limit + HTTP cache), both live.

## Overview

The public portfolio API is currently open and enumerable:
`GET /public/users/:userId` takes a sequential integer id, requires no
authentication, and returns the full portfolio. Anyone can loop
`1, 2, 3 … N` and harvest every user in the database.

This design gates public consumption behind a **required, per-owner API
key**. Each portfolio owner generates one or more keys in the admin panel;
external calls present a key; the backend resolves the key to its owner and
returns *that owner's* portfolio, rate-limited per key and revocable.

## Goal

Give every public read an identity: attribute calls to a specific key,
enforce per-key rate limits, allow revocation/rotation, and — as a direct
consequence of requiring a key — kill sequential-id enumeration of all
users.

## Explicit non-goals / accepted tradeoffs

- **This does not "hide" portfolio content.** Consumption happens in the
  browser, so the key ships in the consuming site's requests and is
  visible to anyone inspecting it. That is acceptable: a leaked key only
  returns *its owner's own* portfolio (content meant to be public), and it
  is rate-limited, attributable, and revocable. The value is
  enumeration-kill + attribution + per-key limits + revocation — **not**
  secrecy of the data.
- No test/live key split, no per-key scopes/permissions, no usage-analytics
  dashboard beyond a `last_used_at` timestamp, no OAuth client model. These
  are out of scope.

## Architecture

```
Admin panel (JWT)                         External portfolio site (browser)
   │  POST /api-keys {label}                 │  GET /public/portfolio
   │  → full key shown ONCE                   │  x-api-key: pk_a3f9c1…
   ▼                                          ▼
ApiKeysModule (JWT-guarded CRUD)          PublicController
   store: key_hash (sha256), prefix,        [PublicKeyThrottlerGuard, ApiKeyGuard]
          label, last_used_at, revoked_at    → owner derived from key
   ▼                                          ▼
              f_api_keys  ◄──────────────  PublicService.getPortfolio(ownerId)
```

Two request paths share one table:
1. **Management** (authenticated owner, JWT): create / list / revoke keys.
2. **Consumption** (anonymous browser, api key): read the key's owner's
   portfolio.

## Data model

New Prisma model `f_api_keys` (follow existing `f_`-table + relation
conventions in `schema.prisma`):

| Column | Type | Notes |
|---|---|---|
| `id` | Int, PK, autoincrement | |
| `user_id` | Int, FK → `f_user` | owner |
| `label` | String | user-supplied name, e.g. "personal site" |
| `key_prefix` | String | first 10 chars of the full key, for display (`pk_a3f9c1d`) |
| `key_hash` | String, `@unique` | sha256(full key), hex |
| `created_at` | DateTime, default now | |
| `last_used_at` | DateTime? | updated on successful consumption (debounced, see below) |
| `revoked_at` | DateTime? | null = active; set = revoked (soft) |

Index on `key_hash` (unique) for O(1) lookup. Relation added to `f_user`
(`f_api_keys f_api_keys[]`). Run `npm run prisma:dev:generate` after the
migration.

## Key format, hashing, show-once

- **Full key:** `pk_` + 48 hex chars from `crypto.randomBytes(24)` →
  192 bits of entropy. Example: `pk_a3f9c1d2...` (51 chars total).
- **Prefix (stored + displayed):** `fullKey.slice(0, 10)` (e.g.
  `pk_a3f9c1d`). Lets the UI show which key is which without storing the
  secret.
- **Hash (stored):** `sha256(fullKey)` hex. The plaintext key is **never
  persisted** — it is returned exactly once, in the `POST /api-keys`
  response, and shown once in a copy-modal. High key entropy (192 bits)
  makes a plain sha256 sufficient; a server-side pepper is a possible
  future hardening, not part of this scope.
- **Lookup:** hash the presented key, `findUnique({ where: { key_hash } })`,
  reject if not found or `revoked_at != null`.

## Backend: consumption path

### Endpoint reshape

- **Add** `GET /public/portfolio` — owner derived from the key; no id in
  the URL, so cross-user access is structurally impossible.
- **Remove** `GET /public/users/:userId` — the enumerable route is gone
  (Nest returns 404 for it). `PublicService.getPortfolio(ownerId: number)`
  is unchanged internally; it is now fed `ownerId` from the guard instead
  of a path param.

### `ApiKeyGuard`

`src/modules/api-keys/guards/api-key.guard.ts`:
1. Read `x-api-key` header. Absent → `401 Unauthorized`.
2. `sha256` it, look up via the api-keys repository.
3. Not found or `revoked_at` set → `401 Unauthorized`.
4. Attach `request.apiKeyOwnerId = key.user_id`.
5. **Debounced `last_used_at`:** if `last_used_at` is null or older than
   60s, fire a non-awaited update and swallow errors — the read must not
   block on or fail from this write, and it must not turn into a write per
   request.
6. Return true.

The controller reads `request.apiKeyOwnerId` and calls
`publicService.getPortfolio(ownerId)`.

### Per-key rate limiting

`PublicKeyThrottlerGuard extends ThrottlerGuard`, overriding `getTracker`:

```ts
protected async getTracker(req: Record<string, any>): Promise<string> {
  const key = req.headers['x-api-key'];
  return key ? `k:${sha256(key)}` : `ip:${req.ip}`;
}
```

- Keyed requests are throttled per key; keyless/invalid floods fall back to
  per-IP (they get rejected 401 by `ApiKeyGuard` anyway, but IP throttling
  caps the DB-hash-lookup cost of an invalid-key flood).
- Reuses the existing `ThrottlerModule` config (`PUBLIC_RATE_TTL` /
  `PUBLIC_RATE_LIMIT`, default 60 req / 60s). The limit is now **per key**
  rather than per IP.
- Guard order on the controller: `@UseGuards(PublicKeyThrottlerGuard,
  ApiKeyGuard)` — throttle before auth so an invalid-key flood is capped
  before the DB lookup.

### Caching correction (scope B)

`PublicCacheInterceptor` currently emits
`Cache-Control: public, max-age=60, s-maxage=60`. With owner-derived
responses, **the same URL returns different data per key** — a shared
cache would serve one owner's portfolio to another. Change to:

```
Cache-Control: private, max-age=60
```

`private` (browser-only) + drop `s-maxage` (no shared/CDN cache). Applied
on the 2xx path only, as today.

### CORS correction (scope A)

`publicCors` middleware must allow the new request header:

```
Access-Control-Allow-Headers: Content-Type, x-api-key
```

Methods (`GET, OPTIONS`) and origin (`*`) unchanged. `/public/portfolio`
is still under `/public/`, so the existing path guard covers it and answers
its preflight.

## Backend: management path

New `ApiKeysModule` following the repo's module + repository pattern
(`repository/api-keys.repository.ts` Prisma impl +
`repository/api-keys-in-memory.repository.ts` for unit tests; service
depends on the interface).

| Method + route | Guards | Behavior |
|---|---|---|
| `POST /api-keys` | `JwtAuthGuard`, `ActiveUserGuard` | Body `{ label }` (class-validator DTO: non-empty string, max len 60). Generates key, stores hash+prefix. **201** → `{ id, label, key, key_prefix, created_at }` — `key` is the full plaintext, returned only here. |
| `GET /api-keys` | `JwtAuthGuard`, `ActiveUserGuard` | Lists the caller's keys: `[{ id, label, key_prefix, created_at, last_used_at, revoked_at }]`. Never returns `key_hash` or plaintext. |
| `DELETE /api-keys/:id` | `JwtAuthGuard`, `ActiveUserGuard` | Revoke (soft: set `revoked_at`) if the key belongs to the caller; else **404**. **204** on success. |

Owner scoping is enforced in the service from the authenticated `sub`
(JWT payload), not from a URL param — every query filters by the caller's
user id. Revoking or listing another user's keys is impossible.

## Frontend

### BFF route handlers

- `app/api/api-keys/route.ts` — `GET` (list) + `POST` (create), proxy to
  `${BACKEND_URL}/api-keys` with the session JWT via the existing
  `backend.ts` / `bff.ts` helpers (401 auto-clears session as today).
- `app/api/api-keys/[id]/route.ts` — `DELETE`, proxy to
  `${BACKEND_URL}/api-keys/:id`.

### Public API admin page

`app/(dashboard)/public-api/page.tsx` + `public-api-panel`:

- **Endpoint:** show `${baseUrl}/public/portfolio` (baseUrl already resolved
  from `BACKEND_PUBLIC_URL`).
- **Auth:** document the header `x-api-key: <your key>`, with a `curl` and a
  `fetch` example.
- **Key management:**
  - List the owner's keys (label, `key_prefix`, created, last used, revoke
    button).
  - "Generate new key" → prompts for a label → on success shows the full
    key **once** in a copy-modal with a "you won't see this again" warning.
  - Revoke button → confirm → `DELETE`, refresh list.
- The old per-user `/public/users/:id` URL display is removed. `getSessionUserId`
  is no longer needed to build the endpoint URL (keys are owner-scoped via
  JWT server-side); keep it only if still used elsewhere on the page.
- The `${baseUrl}/api-docs` docs link is unchanged.

## Error handling

| Situation | Response |
|---|---|
| Consumption, no `x-api-key` | 401 |
| Consumption, unknown/invalid key | 401 |
| Consumption, revoked key | 401 |
| Consumption, over per-key limit | 429 (existing throttler) |
| Old `/public/users/:id` | 404 (route removed) |
| Management without JWT | 401 (existing `JwtAuthGuard`) |
| Revoke a key you don't own | 404 |

401s carry no detail distinguishing missing vs invalid vs revoked (avoid
oracle leakage).

## Testing

**Backend unit:**
- `ApiKeysService`: create returns full key + persists hash & prefix; list
  omits hash/plaintext; revoke sets `revoked_at`; cross-user revoke → 404
  (uses in-memory repo).
- `ApiKeyGuard`: missing / unknown / revoked → 401; valid → attaches
  `apiKeyOwnerId`; `last_used_at` debounce (no update when < 60s old).
- `PublicKeyThrottlerGuard.getTracker`: returns `k:<hash>` with a key,
  `ip:<ip>` without.

**Backend e2e** (`backend/test/`, supertest):
- Register+verify+login → `POST /api-keys` → `GET /public/portfolio` with
  the key → 200 + portfolio shape.
- No key → 401; revoked key → 401; exceed limit → 429.
- `GET /public/users/1` → 404 (route gone).
- Update the existing `public-rate-limit.e2e-spec.ts` to the new route +
  key.

**Frontend unit (Vitest):**
- Panel lists keys, generate flow surfaces the key once, revoke calls the
  BFF and refreshes.

**Frontend e2e (Playwright):** deferred, consistent with the project's
current e2e deferral.

## Config

No new secret required. Reuses `PUBLIC_RATE_TTL` / `PUBLIC_RATE_LIMIT`
(semantics change from per-IP to per-key). Optional future
`API_KEY_PEPPER` for hash hardening is out of scope.

## Migration / rollout notes

- Removing `/public/users/:id` is a breaking change to the live contract.
  Per project state, the only current consumer is the owner's own testing,
  so breaking it now is cheap and deliberate.
- `api-docs` (Swagger) updates automatically from the reshaped controller;
  add an `x-api-key` security scheme annotation so the docs show the header
  requirement.
- Deploy order is irrelevant to data safety (additive table + guard); the
  backend migration (`prisma migrate deploy`) runs on container start as
  today.
```
