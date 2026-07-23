# Public API Release (Scope A — thin) — Design

> **Date:** 2026-07-22
> **Phase:** Post–Fase 5. First step of the README's public-API vision.
> **Status:** Design approved — pending implementation plan

## Goal

Make the existing public portfolio endpoint actually **consumable from an
external site's browser**, and surface it to the owner: open CORS on the
public routes, and add a minimal authenticated "Public API" admin page that
shows the user their endpoint URL, a usage example, and a docs link. No new
endpoints, no versioning — the thinnest release that unblocks real
consumption.

## Scope

**In scope (A):**
- Open CORS on `/public/*` so external origins can fetch public portfolio
  data from the browser.
- A minimal `/public-api` admin page (behind auth) surfacing the owner's
  endpoint URL + one example + a note + a Swagger link.
- Enable the currently-disabled "Public API" nav item.

**Out of scope (explicit — future "B" iteration):** granular versioned
endpoints (`/api/v1/public/{profile,projects,projects/:slug,experiences,
education,courses,technologies}`), API versioning, a friendly username/slug
handle, rate-limiting/caching for public routes, a live "Try it" console,
multi-language snippets, and any reshaping of the public response payload.

## Context (current state)

- The backend exposes exactly ONE public endpoint:
  `GET /public/users/:userId` (`public.controller.ts`) →
  `PublicService.getPortfolio(userId)` returns the whole portfolio nested
  (user + projects + experience + education + courses + custom_sections +
  items), already filtered to **active** items (post soft-delete). No auth.
- **Global CORS is locked** to `FRONTEND_URL`/`CORS_ORIGINS` with
  `credentials: true` (`config/configure-application.ts:14-22`). A
  cross-origin browser request from any external site to `/public/users/:id`
  gets **no** `Access-Control-Allow-Origin` header → the browser blocks it.
  This is the real blocker for "consumed in portfolios".
- Swagger is served at `/api-docs` (`configure-application.ts:34`) —
  documents the whole internal API.
- Frontend nav: the "Public API" item (System group) is `disabled: true`
  → renders a "Soon" badge, no page (`components/layout/navigation.ts:67`,
  `app-sidebar.tsx:37-44`).
- Frontend session helpers (`lib/auth/session.ts`, server-only) decode the
  JWT via `jose`; `role` is read from the `role` claim. The user id lives in
  the JWT `sub` claim (backend payload: `sub`, `role`, `status`).
- Frontend envs: `BACKEND_URL` (internal BFF→backend), `NEXT_PUBLIC_APP_URL`.
  There is no public-facing backend base URL exposed to the browser yet.

## Decisions

| Decision | Choice |
|---|---|
| Release size | Thin (A): open CORS + minimal admin page, no new endpoints |
| CORS policy for `/public/*` | `Access-Control-Allow-Origin: *`, `Allow-Methods: GET, OPTIONS`, **no** credentials |
| Rest of API CORS | Unchanged (locked to `FRONTEND_URL`, `credentials: true`) |
| Public handle | Numeric `userId` (as today); friendly slug deferred to B |
| Admin page depth | Minimal: URL + copy button + one `curl`/`fetch` example + note + Swagger link |
| Public API base URL (browser) | New `NEXT_PUBLIC_PUBLIC_API_URL` env (default `http://localhost:3000`) |
| Rate-limit / cache on public | None in A (follow-up) |
| Public response shape | Unchanged (the existing `getPortfolio` payload) |

## Architecture

### Backend — open CORS on the public routes

- Public portfolio data is public by design (identical to what the public
  site already renders), so `Access-Control-Allow-Origin: *` is correct and
  intended. `*` cannot be combined with `credentials: true`, and the public
  endpoint uses no cookies/auth — so the public routes are credential-less.
- Add a small **middleware scoped to the public routes** (registered via the
  `PublicModule` implementing `NestModule.configure`, applied to the
  module's path) that sets on the response:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type` (harmless; simple GETs need
    none)
  - For an `OPTIONS` preflight hitting a public route, the middleware
    short-circuits with `204` and the above headers (a basic GET with no
    custom headers is a "simple request" and won't preflight, but answering
    OPTIONS keeps it robust).
- The middleware runs for these routes AFTER / independently of the global
  `enableCors`; because it sets `Access-Control-Allow-Origin: *` explicitly
  on the public responses, external origins are allowed there while every
  other route keeps the locked, credentialed CORS. The global
  `enableCors` config is left unchanged.
- No change to `PublicService` or the payload. No new endpoints. No
  rate-limit.

### Frontend — "Public API" admin page (minimal) + nav

- **Session helper:** add `getSessionUserId()` (and a pure
  `userIdFromToken(token)`) to `lib/auth/session.ts`, mirroring
  `getSessionRole`/`roleFromToken`, reading the JWT `sub` claim.
- **Env:** add `NEXT_PUBLIC_PUBLIC_API_URL` (default `http://localhost:3000`)
  = the browser-facing base URL of the backend's public API. Document it in
  `.env.example`.
- **Page:** `app/(dashboard)/public-api/page.tsx` (server component reads the
  session userId; a small client child handles the copy button):
  - The owner's endpoint URL:
    `${NEXT_PUBLIC_PUBLIC_API_URL}/public/users/${userId}` with a copy
    button.
  - One usage example block: a `curl` and a `fetch` snippet using that URL.
  - A short note: read-only, no authentication required, CORS-open, returns
    the full portfolio (active items only).
  - A link to the Swagger docs (`${NEXT_PUBLIC_PUBLIC_API_URL}/api-docs`).
- **Nav:** in `navigation.ts`, change the "Public API" item to
  `{ label: "Public API", icon: Globe, href: "/public-api" }` (drop
  `disabled`) so the "Soon" badge disappears and it links to the page.

## Data flow

```
External site (browser) → GET {PUBLIC_API_BASE}/public/users/:id
  → public CORS middleware sets Access-Control-Allow-Origin: *
  → PublicService.getPortfolio(id) (active items only)
  → JSON portfolio; browser accepts the cross-origin response

Owner (dashboard) → /public-api page
  → server reads userId from session JWT (sub)
  → renders {PUBLIC_API_BASE}/public/users/{userId} + copy + example + docs link
```

## Error handling & edge cases

- Unknown `userId` → `GET /public/users/:id` already returns `404`
  (`getPortfolio` throws `NotFoundException`) — unchanged; CORS headers still
  apply so the browser can read the 404 body.
- The global credentialed CORS must remain intact for every non-public route
  (auth, projects, etc.) — the public middleware must not weaken them.
- If `NEXT_PUBLIC_PUBLIC_API_URL` is unset, the page falls back to
  `http://localhost:3000` (dev default) so it never renders an empty URL.

## Testing

- **Backend e2e:** a request to `/public/users/:id` responds with
  `Access-Control-Allow-Origin: *`; a request to a non-public route does NOT
  (keeps the locked origin). An `OPTIONS /public/users/:id` preflight returns
  `204` with the open CORS headers.
- **Frontend unit (Vitest):** the `/public-api` page renders the endpoint
  URL built from a mocked `userId` + env, shows the copy button and the
  example snippet, and links to `/api-docs`; the nav renders "Public API" as
  an enabled link (no "Soon" badge).

## Decomposition & execution

One small spec, one plan. Two thin layers (backend CORS middleware; frontend
page + nav + session helper + env) that are independently testable. Execute
via subagent-driven-development.

## Global constraints (carry into the plan)

- Never implement on `master` — branch `feat/public-api-release` (created).
- Commit trailer exactly: `Co-Authored-By: Claude Opus 4.8 (1M context)
  <noreply@anthropic.com>`.
- Do not push to origin unless explicitly asked.
- Next.js 16 has breaking changes — consult
  `frontend/node_modules/next/dist/docs/` before Next.js code
  (`frontend/AGENTS.md`); `NEXT_PUBLIC_*` envs are inlined at build.
- Do not weaken the existing global (credentialed) CORS for non-public
  routes; the `*` policy applies to `/public/*` only.
- Public data exposed is exactly what the public site already shows — no new
  fields, no payload reshaping.
