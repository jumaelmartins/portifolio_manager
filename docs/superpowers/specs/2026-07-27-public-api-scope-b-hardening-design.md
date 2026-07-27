# Public API Scope B — Hardening — Design

> **Date:** 2026-07-27
> **Phase:** Post Scope A (thin public-API release). Second step of the README's public-API vision.
> **Status:** Design approved — pending implementation plan

## Goal

Make the existing single public endpoint `GET /public/users/:userId`
**production-grade** before it is used at scale. No new endpoints, no payload
reshape, no versioning, no friendly handle. Two hardening layers only:
IP-based **rate limiting** on the public routes, and **HTTP caching** on the
public response.

Driver: hardening (not a concrete consumer). There is no external portfolio
site consuming the API yet; the goal is to protect an open, no-auth,
`*`-CORS endpoint from abuse and unnecessary DB load before real traffic
arrives.

## Scope

**In scope:**
- **Rate limiting** on `/public/*` only (IP-based), returning `429` with
  `Retry-After` when exceeded.
- **HTTP caching** on the public portfolio response (`Cache-Control` +
  ETag/`304`).

**Out of scope (explicit — deferred):** API versioning (`/api/v1/public/...`),
a friendly username/slug handle, granular per-resource endpoints
(`profile`, `projects/:slug`, `experiences`, ...), a live "Try it" console,
multi-language snippets, server-side (in-memory/Redis) response caching, any
reshaping of the public payload, and rate-limiting/observability on the
authenticated admin routes.

## Context (current state)

- The backend exposes exactly ONE public endpoint:
  `GET /public/users/:userId` (`public.controller.ts`) →
  `PublicService.getPortfolio(userId)` returns the whole portfolio nested,
  already filtered to **active** items (post soft-delete). No auth.
- **CORS** on `/public/*` is open (`Access-Control-Allow-Origin: *`,
  `Allow-Methods: GET, OPTIONS`) via the `publicCors` Express middleware
  (`config/public-cors.middleware.ts`), registered BEFORE the global
  credentialed `enableCors` in `config/configure-application.ts`. OPTIONS
  preflight to a public route short-circuits `204`. Every non-public route
  keeps the locked, credentialed CORS.
- **No IP-based throttling exists.** The only "rate limiting" in the codebase
  is DB-backed atomic attempt counters for auth flows (email verification /
  password reset: `failed_attempts` column + cooldown + `429`), which is
  per-token/per-user and does **not** apply to anonymous public GET traffic.
  `@nestjs/throttler` is not installed.
- Nest 11 + Prisma 6 backend. `PublicModule` currently wires only
  `PublicController` + `PublicService`.

## Decisions

| Decision | Choice |
|---|---|
| Hardening items | Rate limiting + HTTP caching only |
| Throttle scope | `/public/*` only; admin routes untouched |
| Throttle mechanism | `@nestjs/throttler` `ThrottlerGuard` on `PublicController` (NOT a global `APP_GUARD`) |
| Throttle default | 60 requests / 60 s per IP; env-overridable |
| Throttle storage | Default in-memory (single instance); Redis store = documented follow-up |
| Cache mechanism | `Cache-Control: public, max-age=60, s-maxage=60` header + Express weak ETag / `304` |
| Versioning / slug / granular endpoints | Deferred |
| `trust proxy` | NOT force-enabled; documented as a deploy-time setting |

## Architecture

### Component 1 — Rate limiting (public routes only)

- **Dependency:** add `@nestjs/throttler` (version compatible with Nest 11,
  `^6`). Confirm the exact compatible version during the plan.
- **Wiring:** import `ThrottlerModule.forRoot([{ ttl, limit }])` in
  `PublicModule`, and apply `ThrottlerGuard` to `PublicController` via
  `@UseGuards(ThrottlerGuard)`. It is **not** registered as a global
  `APP_GUARD`, so only the public routes are throttled — the authenticated
  admin API is unaffected (the owner's own panel is never rate-limited).
- **Limits:** default **60 requests per 60 s per IP**. Overridable via env:
  `PUBLIC_RATE_LIMIT` (count) and `PUBLIC_RATE_TTL` (seconds). Values read
  through `@nestjs/config` when wiring `forRoot` (use `forRootAsync` if env
  reads require the config service; otherwise constants with env fallback).
- **Response on exceed:** `@nestjs/throttler` returns `429 Too Many Requests`
  and sets `Retry-After` automatically.
- **Tracker:** default per-IP tracker (`req.ip`).
- **CORS interaction:** the `publicCors` middleware runs BEFORE the guard, so
  a `429` response still carries `Access-Control-Allow-Origin: *` and the
  browser can read it. An `OPTIONS` preflight is short-circuited to `204` by
  `publicCors` before the guard runs, so preflight requests are never
  throttled.
- **Storage:** default in-memory `ThrottlerStorage`. Correct for a single
  instance. Multi-instance deployments would need a shared (Redis) store —
  documented as a follow-up, not built here.

### Component 2 — HTTP caching

- The `GET /public/users/:userId` route responds with
  `Cache-Control: public, max-age=60, s-maxage=60`. Public portfolio data
  changes rarely, so a short shared cache cheaply protects the DB and lets a
  CDN/browser serve repeats. Set via `@Header('Cache-Control', ...)` on the
  route handler (static header; no per-user logic).
- **ETag / `304`:** Express auto-generates a weak `ETag` for response bodies
  (default enabled) and answers conditional `If-None-Match` requests with
  `304 Not Modified`. Verify this is active at bootstrap (Nest does not
  disable it by default); if for any reason it is off, add a minimal ETag
  interceptor. No custom cache store.

### Data flow (unchanged handler; new gates)

```
external browser → GET {PUBLIC_API_BASE}/public/users/:id
  → publicCors middleware sets Access-Control-Allow-Origin: *   [before guard, always]
  → ThrottlerGuard checks per-IP count
      → over limit: 429 Too Many Requests + Retry-After (CORS headers present)
      → under limit: continue
  → PublicService.getPortfolio(id) (active items only)
  → 200 + Cache-Control: public, max-age=60, s-maxage=60 + ETag
  → repeat with If-None-Match: <etag> → 304 Not Modified
```

## Error handling & edge cases

- Over-limit anonymous traffic → `429` + `Retry-After`; CORS headers still
  present (middleware precedes the guard) so a browser consumer can read it.
- Unknown `userId` → `getPortfolio` still throws `404`
  (`NotFoundException`); a `404` is a normal request and counts toward the
  rate limit (acceptable — cheap and bounds enumeration).
- OPTIONS preflight → `204` from `publicCors`, never throttled.
- The global credentialed CORS for every non-public route stays intact and
  un-throttled.

## Deploy note (documented, not built)

IP-based throttling relies on `req.ip`. Behind a reverse proxy / load
balancer, `req.ip` is the proxy's address unless Express `trust proxy` is
enabled to read `X-Forwarded-For`. Enabling `trust proxy` blindly lets
clients spoof `X-Forwarded-For` and evade the limit, so it must only be
enabled when the app sits behind a trusted proxy. This is a deploy-time
configuration decision — documented here, defaulted OFF, not force-enabled in
code.

## Testing

- **Backend e2e** (`backend/test/`, supertest):
  - Under the limit → `200` with `Cache-Control: public, max-age=60`.
  - Exceeding the limit (loop past `PUBLIC_RATE_LIMIT`) → `429` with a
    `Retry-After` header; the `429` still carries
    `Access-Control-Allow-Origin: *`.
  - A conditional request with the returned `If-None-Match` → `304`.
  - The existing public-cors e2e stays green (open CORS on public, locked on
    non-public).
  - A non-public route is unaffected by the throttle guard.
  - Test-friendly limits: set a low `PUBLIC_RATE_LIMIT`/`PUBLIC_RATE_TTL` via
    env in the e2e setup so the over-limit case is fast and deterministic.
- **Frontend:** no change required. (Optionally, a one-line note on the
  existing `/public-api` page mentioning the rate limit — deferred to a
  follow-up; ask before adding.)

## Decomposition & execution

One small spec, one plan. A single backend layer (throttle guard + cache
header + e2e), independently testable, no frontend change. Execute via
subagent-driven-development.

## Global constraints (carry into the plan)

- Never implement on `master` — branch `feat/public-api-hardening` (created).
- Commit trailer exactly: `Co-Authored-By: Claude Opus 4.8 (1M context)
  <noreply@anthropic.com>`.
- Do not push to origin unless explicitly asked.
- Do NOT run `npm run lint`/`--fix` in backend implementer subagents (it
  reformats out-of-scope files via CRLF churn — a repeated prior issue).
- Do not weaken the existing global (credentialed) CORS for non-public routes,
  and do not change the `publicCors` behavior for `/public/*`.
- No change to `PublicService` or the payload. No new endpoints. No
  versioning. No slug.
- After any dependency add, keep `package-lock.json` consistent; the throttle
  guard is scoped to `PublicController`, never registered as a global guard.
