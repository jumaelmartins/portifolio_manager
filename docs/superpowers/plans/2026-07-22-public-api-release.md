# Public API Release (Scope A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing `GET /public/users/:userId` endpoint consumable from any external site's browser (open CORS on `/public/*`), and add a minimal authenticated "Public API" admin page that shows the owner their endpoint URL, a usage example, and a docs link.

**Architecture:** A small Express middleware sets permissive CORS (`Access-Control-Allow-Origin: *`, no credentials) for `/public` paths only, registered in `configure-application.ts` BEFORE the global `enableCors` so it wins the ordering (and answers OPTIONS preflight). The frontend gains a `getSessionUserId` helper (JWT `sub`), a `NEXT_PUBLIC_PUBLIC_API_URL` env, and a `/public-api` page (server component reads the session id; a client panel renders the URL + copy button + example). The nav item is enabled.

**Tech Stack:** NestJS 11 (Express) + Jest/Supertest; Next.js 16 + React 19 + Vitest/Testing Library.

## Global Constraints

- Never implement on `master` — work on branch `feat/public-api-release` (already created).
- Commit trailer EXACTLY (last line): `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Do not push to origin.
- **Do NOT weaken the global credentialed CORS** for non-public routes — the `*` policy applies to `/public` paths only.
- Next.js 16 breaking changes — consult `frontend/node_modules/next/dist/docs/` before Next.js code (`frontend/AGENTS.md`). `NEXT_PUBLIC_*` envs are inlined at build. Route/session helpers are server-only.
- No new public endpoints, no payload reshaping, no rate-limiting (deferred to a later "B" iteration).
- Backend commands run from `backend/`; frontend from `frontend/`.

## File Structure

- Create `backend/src/config/public-cors.middleware.ts` — the `/public` CORS Express middleware.
- Modify `backend/src/config/configure-application.ts` — register it before `enableCors`.
- Create `backend/test/public-cors.e2e-spec.ts`.
- Modify `frontend/src/lib/auth/session.ts` — add `userIdFromToken` + `getSessionUserId`.
- Create `frontend/src/lib/auth/session.test.ts` (or extend if present).
- Modify `frontend/.env.example` — add `NEXT_PUBLIC_PUBLIC_API_URL`.
- Create `frontend/src/features/public-api/components/public-api-panel.tsx` + its test.
- Create `frontend/src/app/(dashboard)/public-api/page.tsx`.
- Modify `frontend/src/components/layout/navigation.ts` — enable the "Public API" item.
- Modify `frontend/src/components/layout/admin-shell.test.tsx` — assert the enabled link.

---

### Task 1: Backend — open CORS on `/public/*`

**Files:**
- Create: `backend/src/config/public-cors.middleware.ts`
- Modify: `backend/src/config/configure-application.ts`
- Test: `backend/test/public-cors.e2e-spec.ts`

**Interfaces:**
- Produces `publicCors(req, res, next)` — an Express request handler. For requests whose path is under `/public`, it sets `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`, and answers `OPTIONS` with `204`. All other paths pass through untouched.
- Registered in `configureApplication` via `app.use(publicCors)` BEFORE `app.enableCors(...)`.

- [ ] **Step 1: Write the failing e2e test**

Create `backend/test/public-cors.e2e-spec.ts`:

```typescript
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';

const EXTERNAL_ORIGIN = 'https://someone-portfolio.example.com';

describe('Public API CORS (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp =
      moduleFixture.createNestApplication<NestExpressApplication>();
    configureApplication(nestApp);
    app = nestApp;
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows any origin on a public route (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/users/999999')
      .set('Origin', EXTERNAL_ORIGIN);

    // 404 for a missing user is fine — the CORS header is set regardless.
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('answers the public preflight with 204 + open CORS', async () => {
    const res = await request(app.getHttpServer())
      .options('/public/users/1')
      .set('Origin', EXTERNAL_ORIGIN)
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
  });

  it('does NOT open non-public routes to an external origin', async () => {
    const res = await request(app.getHttpServer())
      .get('/projects')
      .set('Origin', EXTERNAL_ORIGIN);

    // Unauthenticated → 401; and no wildcard CORS for the external origin.
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm run test:e2e -- public-cors` (needs the e2e DB up — `docker compose -f ../docker-compose.e2e.yml up -d db` + `npm run prisma:e2e:migrate` if not already). If the e2e environment is unavailable, note it and rely on Step 5's `npm run build` + a controller check; the spec still must be written.
Expected: FAIL — the public GET has no `access-control-allow-origin: *` yet.

- [ ] **Step 3: Create the middleware**

Create `backend/src/config/public-cors.middleware.ts`:

```typescript
import type { NextFunction, Request, Response } from 'express';

/**
 * Opens CORS for the read-only public API (`/public/*`) so external sites can
 * consume portfolio data from the browser. Public data is public by design;
 * `*` cannot combine with credentials, and these routes use no cookies/auth.
 * Registered BEFORE the global (credentialed, origin-locked) `enableCors` so
 * it wins for `/public` paths and answers their preflight.
 */
export function publicCors(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/public' || req.path.startsWith('/public/')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
  }
  next();
}
```

- [ ] **Step 4: Register it before `enableCors`**

In `backend/src/config/configure-application.ts`, add the import and the `app.use` call as the FIRST thing inside `configureApplication` (before `app.enableCors`):

```typescript
import { publicCors } from './public-cors.middleware';
```

```typescript
export function configureApplication(app: NestExpressApplication) {
  const configService = app.get(ConfigService);

  app.use(publicCors);

  app.enableCors({
    // ...unchanged...
  });
  // ...rest unchanged...
}
```

- [ ] **Step 5: Run the e2e (if env available) + build**

Run: `npm run test:e2e -- public-cors` → PASS (3/3). Then `npm run build` → clean.
If the e2e DB is unavailable, run at least `npm run build` and record the e2e as deferred (consistent with the project's deferred-e2e posture); the assertions are environment-light (they don't depend on seeded data).

- [ ] **Step 6: Commit**

```bash
git add backend/src/config/public-cors.middleware.ts backend/src/config/configure-application.ts backend/test/public-cors.e2e-spec.ts
git commit -m "feat(backend): open CORS on public routes for external consumption"
```

---

### Task 2: Frontend — `getSessionUserId` + public API base env

**Files:**
- Modify: `frontend/src/lib/auth/session.ts`
- Test: `frontend/src/lib/auth/session.test.ts` (create, or extend if present)
- Modify: `frontend/.env.example`

**Interfaces:**
- Produces `userIdFromToken(token: string | undefined): string | null` (JWT `sub` claim) and `getSessionUserId(): Promise<string | null>` (reads the session cookie), mirroring the existing `roleFromToken`/`getSessionRole`.
- Documents `NEXT_PUBLIC_PUBLIC_API_URL` (browser-facing public API base) in `.env.example`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/auth/session.test.ts` (if a session test already exists, add these cases to it instead):

```typescript
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { userIdFromToken } from "./session";

async function makeToken(claims: Record<string, unknown>) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode("test-secret"));
}

describe("userIdFromToken", () => {
  it("returns the sub claim as a string", async () => {
    const token = await makeToken({ sub: 7, role: 2 });
    expect(userIdFromToken(token)).toBe("7");
  });

  it("returns null when there is no token", () => {
    expect(userIdFromToken(undefined)).toBeNull();
  });

  it("returns null when sub is absent", async () => {
    const token = await makeToken({ role: 2 });
    expect(userIdFromToken(token)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm run test:run -- session`
Expected: FAIL — `userIdFromToken` is not exported.

- [ ] **Step 3: Add the helpers**

In `frontend/src/lib/auth/session.ts`, add (next to `roleFromToken`/`getSessionRole`):

```typescript
export function userIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const sub = decodeJwt(token).sub;
  return sub == null ? null : String(sub);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return userIdFromToken(token);
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npm run test:run -- session`
Expected: PASS.

- [ ] **Step 5: Document the env**

In `frontend/.env.example`, add a line near `NEXT_PUBLIC_APP_URL`:

```
# Browser-facing base URL of the backend's public API (shown on the Public API page)
NEXT_PUBLIC_PUBLIC_API_URL=http://localhost:3000
```

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit` → clean.

```bash
git add frontend/src/lib/auth/session.ts frontend/src/lib/auth/session.test.ts frontend/.env.example
git commit -m "feat(frontend): add getSessionUserId + public API base env"
```

---

### Task 3: Frontend — `/public-api` page + panel + enable nav

**Files:**
- Create: `frontend/src/features/public-api/components/public-api-panel.tsx`
- Test: `frontend/src/features/public-api/components/public-api-panel.test.tsx`
- Create: `frontend/src/app/(dashboard)/public-api/page.tsx`
- Modify: `frontend/src/components/layout/navigation.ts`
- Modify: `frontend/src/components/layout/admin-shell.test.tsx`

**Interfaces:**
- Consumes `getSessionUserId` (Task 2) and `NEXT_PUBLIC_PUBLIC_API_URL`.
- Produces `<PublicApiPanel userId={string | null} baseUrl={string} />` — a client component rendering the owner's endpoint URL, a copy button, a `curl`/`fetch` example, a read-only/no-auth note, and a Swagger link.
- Produces the `/public-api` dashboard route and enables the nav item.

- [ ] **Step 1: Write the failing panel test**

Create `frontend/src/features/public-api/components/public-api-panel.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicApiPanel } from "./public-api-panel";

describe("PublicApiPanel", () => {
  it("renders the owner endpoint URL and a Swagger link", () => {
    render(<PublicApiPanel userId="7" baseUrl="https://api.example.com" />);

    expect(
      screen.getByText("https://api.example.com/public/users/7"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /API docs/i })).toHaveAttribute(
      "href",
      "https://api.example.com/api-docs",
    );
  });

  it("copies the endpoint URL to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<PublicApiPanel userId="7" baseUrl="https://api.example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith(
      "https://api.example.com/public/users/7",
    );
  });

  it("shows a fallback when the user id is unavailable", () => {
    render(<PublicApiPanel userId={null} baseUrl="https://api.example.com" />);
    expect(
      screen.getByText(/could not determine your user id/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm run test:run -- public-api-panel`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the panel**

Create `frontend/src/features/public-api/components/public-api-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type PublicApiPanelProps = {
  userId: string | null;
  baseUrl: string;
};

export function PublicApiPanel({ userId, baseUrl }: PublicApiPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!userId) {
    return (
      <p className="text-sm text-muted-foreground">
        We could not determine your user id. Please sign out and back in.
      </p>
    );
  }

  const endpoint = `${baseUrl}/public/users/${userId}`;
  const docsUrl = `${baseUrl}/api-docs`;

  async function copy() {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your public endpoint
        </h2>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-3">
          <code className="min-w-0 flex-1 truncate text-sm">{endpoint}</code>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Copy endpoint URL"
            onClick={copy}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Read-only, no authentication required, open to any origin. Returns
          your full portfolio (active items only) as JSON.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Example</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-card/60 p-3 text-sm">
          <code>{`curl ${endpoint}

fetch("${endpoint}")
  .then((r) => r.json())
  .then(console.log);`}</code>
        </pre>
      </section>

      <p className="text-sm text-muted-foreground">
        Full API reference:{" "}
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          API docs
        </a>
        .
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npm run test:run -- public-api-panel`
Expected: PASS.

- [ ] **Step 5: Create the page (server component)**

Create `frontend/src/app/(dashboard)/public-api/page.tsx`:

```tsx
import { getSessionUserId } from "@/lib/auth/session";
import { PublicApiPanel } from "@/features/public-api/components/public-api-panel";

export default async function PublicApiPage() {
  const userId = await getSessionUserId();
  const baseUrl =
    process.env.NEXT_PUBLIC_PUBLIC_API_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">System</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Public API
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Consume your portfolio content from any external site.
        </p>
      </header>

      <PublicApiPanel userId={userId} baseUrl={baseUrl} />
    </div>
  );
}
```

- [ ] **Step 6: Enable the nav item**

In `frontend/src/components/layout/navigation.ts`, change the "Public API" item in the "System" group from:

```typescript
      { label: "Public API", icon: Globe, disabled: true },
```

to:

```typescript
      { label: "Public API", icon: Globe, href: "/public-api" },
```

- [ ] **Step 7: Assert the enabled nav link**

In `frontend/src/components/layout/admin-shell.test.tsx`, add to the first test (after the existing "Projects" link assertion):

```typescript
    expect(screen.getByRole("link", { name: "Public API" })).toHaveAttribute(
      "href",
      "/public-api",
    );
```

(The existing `getAllByText("Soon").length).toBeGreaterThan(0)` assertion still holds — Media, Roadmap, FAQ, Suggestions, Changelog, Audit Logs, and Settings remain disabled.)

- [ ] **Step 8: Run the affected tests + full suite + build**

Run: `npm run test:run -- public-api-panel` and `npm run test:run -- admin-shell`, then `npm run test:run` (full), then `npx tsc --noEmit`.
Expected: all PASS; tsc clean.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/features/public-api frontend/src/app/\(dashboard\)/public-api frontend/src/components/layout/navigation.ts frontend/src/components/layout/admin-shell.test.tsx
git commit -m "feat(frontend): Public API admin page + enable nav item"
```

---

## Self-Review

**Spec coverage:**
- Open CORS on `/public/*` (`*`, no credentials, GET/OPTIONS; rest locked) → Task 1. ✓
- Minimal admin page (URL + copy + example + note + Swagger link) → Task 3 (`PublicApiPanel`). ✓
- Numeric `userId` handle from the session (`sub`) → Task 2 (`getSessionUserId`) + Task 3. ✓
- `NEXT_PUBLIC_PUBLIC_API_URL` env with dev default → Task 2 (`.env.example`) + Task 3 (page default). ✓
- Enable the nav item (drop "Soon") → Task 3. ✓
- Testing: backend e2e (CORS split + preflight) + frontend unit (panel + nav) → Tasks 1, 3. ✓
- Out of scope (granular/versioned API, slug, rate-limit, reshape) → not built. ✓

**Placeholder scan:** No TBD/TODO; every step has complete code.

**Type/name consistency:** `userIdFromToken`/`getSessionUserId` return `string | null`, consumed as `userId: string | null` by `PublicApiPanel` and the page. `publicCors` signature matches its `app.use` registration. `NEXT_PUBLIC_PUBLIC_API_URL` default string is identical in the page and `.env.example`.

**Refinement noted:** the spec suggested the CORS middleware be owned by `PublicModule` (`NestModule.configure`); the plan instead registers a plain Express middleware in `configureApplication` BEFORE `enableCors`. Rationale: guaranteed ordering over the global cors (so the public OPTIONS preflight is answered with `*` and GET responses aren't left header-less for external origins). Same design intent — `*` on `/public` only, rest untouched.

## Execution Handoff

Execute via subagent-driven-development on `feat/public-api-release`. Small, three sequential tasks; the frontend Tasks 2–3 depend on nothing in Task 1 (independent layers) but keep the order for a clean review.
