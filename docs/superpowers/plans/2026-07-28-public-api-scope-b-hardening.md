# Public API Scope B — Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Production-harden the existing single public endpoint `GET /public/users/:userId` with IP-based rate limiting and HTTP caching — no new endpoints, no payload change.

**Architecture:** Add `@nestjs/throttler` and apply its `ThrottlerGuard` scoped to `PublicController` only (via `@UseGuards`, NOT a global `APP_GUARD`), configured through `ThrottlerModule.forRootAsync` reading env-driven limits inside `PublicModule`. Add a static `Cache-Control` response header on the public route via `@Header`; rely on Express's default weak ETag for conditional `304` responses. Everything is backend-only; the existing `publicCors` middleware (registered before the guard) keeps CORS headers on every response including `429`.

**Tech Stack:** NestJS 11, `@nestjs/throttler` ^6 (6.5.0 — peers include `@nestjs/common ^11`), `@nestjs/config` (global `ConfigModule`), Express (default ETag), Jest + supertest e2e.

## Global Constraints

- Never implement on `master` — work on branch `feat/public-api-hardening` (already created and checked out).
- Commit trailer EXACTLY: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Do NOT push to origin unless explicitly asked.
- Do NOT run `npm run lint` / `--fix` in the backend — it reformats out-of-scope files (CRLF churn); a repeated prior issue. Only touch the files listed per task.
- Throttling applies to `/public/*` ONLY. Do NOT register `ThrottlerGuard` as a global `APP_GUARD`. The authenticated admin API stays un-throttled.
- Do NOT change `PublicService`, the response payload, `publicCors` behavior, or the global credentialed `enableCors` for non-public routes.
- `@nestjs/throttler` `ttl` is in **milliseconds** — use the exported `seconds()` helper (`seconds(60)` = 60000). Env `PUBLIC_RATE_TTL` is expressed in **seconds**.
- Run all backend commands from `backend/`. e2e needs the Docker Compose PostgreSQL on port 55432 (`npm run test:e2e`).

---

## File Structure

- `backend/package.json` + `backend/package-lock.json` — add `@nestjs/throttler` dependency (Task 1).
- `backend/src/modules/public/public.module.ts` — import `ThrottlerModule.forRootAsync` with env-driven limits (Task 1).
- `backend/src/modules/public/public.controller.ts` — add `@UseGuards(ThrottlerGuard)` (Task 1) and `@Header('Cache-Control', …)` (Task 2).
- `backend/.env.example` — document `PUBLIC_RATE_LIMIT` / `PUBLIC_RATE_TTL` (Task 1).
- `backend/test/public-rate-limit.e2e-spec.ts` — throttle e2e (Task 1).
- `backend/test/public-cache.e2e-spec.ts` — cache/304 e2e (Task 2).

Two independent backend deliverables; each has its own isolated e2e spec (own app instance → own in-memory throttle store → own env), so they never interfere.

---

## Task 1: Rate-limit `/public/*` (throttler guard + env config + e2e)

**Files:**
- Modify: `backend/package.json`, `backend/package-lock.json` (via `npm install`)
- Modify: `backend/src/modules/public/public.module.ts`
- Modify: `backend/src/modules/public/public.controller.ts`
- Modify: `backend/.env.example`
- Test: `backend/test/public-rate-limit.e2e-spec.ts` (create)

**Interfaces:**
- Consumes: `AppModule` (`src/app.module.ts`), `configureApplication` (`src/config/configure-application.ts`), global `ConfigModule` (already `isGlobal: true` in `AppModule`).
- Produces: `PublicController` now guarded by `ThrottlerGuard`; env vars `PUBLIC_RATE_LIMIT` (request count, default `60`) and `PUBLIC_RATE_TTL` (window seconds, default `60`). Task 2 adds a header to the same controller/route — leave the `@Get('users/:userId')` handler signature unchanged.

- [ ] **Step 1: Write the failing e2e test**

Create `backend/test/public-rate-limit.e2e-spec.ts`:

```typescript
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';

const EXTERNAL_ORIGIN = 'https://someone-portfolio.example.com';

describe('Public API hardening — rate limit (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Low, deterministic limit for this spec only. ConfigService reads
    // process.env; ThrottlerModule.forRootAsync's factory runs at compile
    // (below), so setting these before compile() takes effect.
    process.env.PUBLIC_RATE_LIMIT = '3';
    process.env.PUBLIC_RATE_TTL = '60';

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
    delete process.env.PUBLIC_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_TTL;
    await app.close();
  });

  it('allows up to the limit, then 429 with Retry-After and open CORS', async () => {
    const path = '/public/users/999999';

    for (let i = 0; i < 3; i += 1) {
      const ok = await request(app.getHttpServer())
        .get(path)
        .set('Origin', EXTERNAL_ORIGIN);
      expect(ok.status).not.toBe(429);
    }

    const blocked = await request(app.getHttpServer())
      .get(path)
      .set('Origin', EXTERNAL_ORIGIN);

    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    // publicCors runs before the guard → CORS header present even on 429.
    expect(blocked.headers['access-control-allow-origin']).toBe('*');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e -- --testPathPattern=public-rate-limit`
Expected: FAIL — no throttling wired yet, so the 4th request returns `404` (missing user), not `429`; the `expect(blocked.status).toBe(429)` assertion fails.

- [ ] **Step 3: Install the throttler dependency**

Run (from `backend/`): `npm install @nestjs/throttler@^6`
Expected: `@nestjs/throttler` (6.x) added to `package.json` dependencies and `package-lock.json` updated. Do NOT run lint or format.

- [ ] **Step 4: Wire the throttler in `PublicModule`**

Replace the contents of `backend/src/modules/public/public.module.ts` with:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // ttl is milliseconds; env PUBLIC_RATE_TTL is seconds.
          ttl: seconds(Number(config.get<string>('PUBLIC_RATE_TTL') ?? '60')),
          limit: Number(config.get<string>('PUBLIC_RATE_LIMIT') ?? '60'),
        },
      ],
    }),
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
```

- [ ] **Step 5: Apply the guard on `PublicController`**

Edit `backend/src/modules/public/public.controller.ts` — add the import and the `@UseGuards(ThrottlerGuard)` class decorator. Leave the handler body unchanged:

```typescript
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicService } from './public.service';

@Controller('public')
@UseGuards(ThrottlerGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('users/:userId')
  getPortfolio(@Param('userId') userId: string) {
    return this.publicService.getPortfolio(+userId);
  }
}
```

- [ ] **Step 6: Document the env vars**

Append to `backend/.env.example` (after the existing `BACKEND_PUBLIC_URL` line or at the end of the file):

```
# Public API rate limiting (applies to /public/* only). Defaults: 60 req / 60s per IP.
PUBLIC_RATE_LIMIT=60
PUBLIC_RATE_TTL=60
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm run test:e2e -- --testPathPattern=public-rate-limit`
Expected: PASS — 3 requests allowed, the 4th returns `429` with a `Retry-After` header and `Access-Control-Allow-Origin: *`.

- [ ] **Step 8: Guard against regressions in the neighbouring public e2e**

Run: `npm run test:e2e -- --testPathPattern="public-cors|soft-delete|reorder"`
Expected: PASS — each of those specs uses its own app instance with the default limit (60), and none makes more than a handful of `/public` requests, so the throttle does not trip. If any fails with `429`, that spec exceeds 60 public reads; do not raise the global default — instead report it (out of scope to fix here).

- [ ] **Step 9: Commit**

```bash
git add backend/package.json backend/package-lock.json \
  backend/src/modules/public/public.module.ts \
  backend/src/modules/public/public.controller.ts \
  backend/.env.example \
  backend/test/public-rate-limit.e2e-spec.ts
git commit -m "feat(backend): rate-limit public API routes

Apply @nestjs/throttler ThrottlerGuard scoped to PublicController
(/public/* only, not a global guard), configured via
ThrottlerModule.forRootAsync with env-driven PUBLIC_RATE_LIMIT /
PUBLIC_RATE_TTL (default 60 req / 60s per IP). Over-limit anonymous
traffic gets 429 + Retry-After; publicCors precedes the guard so the
open CORS header survives on the 429. Admin routes stay un-throttled.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: HTTP caching on the public response (Cache-Control + ETag/304)

**Files:**
- Modify: `backend/src/modules/public/public.controller.ts`
- Test: `backend/test/public-cache.e2e-spec.ts` (create)

**Interfaces:**
- Consumes: from Task 1 — `PublicController` is `@Controller('public')` with `@UseGuards(ThrottlerGuard)` and the `@Get('users/:userId')` handler; env vars `PUBLIC_RATE_LIMIT` / `PUBLIC_RATE_TTL`. Test helper `loginE2eUser(app)` (`backend/test/helpers/auth.ts`) returns a JWT for the seeded user `e2e@portfolio.test`; the numeric user id is JWT `sub`.
- Produces: the public route responds with `Cache-Control: public, max-age=60, s-maxage=60`; conditional `If-None-Match` requests receive `304`.

- [ ] **Step 1: Write the failing e2e test**

Create `backend/test/public-cache.e2e-spec.ts`:

```typescript
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser } from './helpers/auth';

function userIdFromToken(token: string): number {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
  );
  return Number(payload.sub);
}

describe('Public API hardening — caching (e2e)', () => {
  let app: INestApplication<App>;
  let userId: number;

  beforeAll(async () => {
    // High limit so cache assertions never trip the throttle.
    process.env.PUBLIC_RATE_LIMIT = '1000';
    process.env.PUBLIC_RATE_TTL = '60';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp =
      moduleFixture.createNestApplication<NestExpressApplication>();
    configureApplication(nestApp);
    app = nestApp;
    await app.init();

    const token = await loginE2eUser(app);
    userId = userIdFromToken(token);
  });

  afterAll(async () => {
    delete process.env.PUBLIC_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_TTL;
    await app.close();
  });

  it('sets a public Cache-Control header on the portfolio response', async () => {
    const res = await request(app.getHttpServer())
      .get(`/public/users/${userId}`)
      .expect(200);

    expect(res.headers['cache-control']).toBe(
      'public, max-age=60, s-maxage=60',
    );
    expect(res.headers['etag']).toBeDefined();
  });

  it('returns 304 for a conditional request with a matching ETag', async () => {
    const first = await request(app.getHttpServer())
      .get(`/public/users/${userId}`)
      .expect(200);

    const etag = first.headers['etag'] as string;

    const second = await request(app.getHttpServer())
      .get(`/public/users/${userId}`)
      .set('If-None-Match', etag);

    expect(second.status).toBe(304);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e -- --testPathPattern=public-cache`
Expected: FAIL on the first test — no `Cache-Control` header is set yet, so `res.headers['cache-control']` is `undefined`, not `'public, max-age=60, s-maxage=60'`. (The `304` test may already pass via Express's default ETag; the `Cache-Control` assertion is the RED.)

- [ ] **Step 3: Add the `Cache-Control` header on the public route**

Edit `backend/src/modules/public/public.controller.ts` — add `Header` to the imports and the `@Header(...)` decorator on the handler. Keep the Task 1 guard:

```typescript
import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicService } from './public.service';

@Controller('public')
@UseGuards(ThrottlerGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('users/:userId')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60')
  getPortfolio(@Param('userId') userId: string) {
    return this.publicService.getPortfolio(+userId);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e -- --testPathPattern=public-cache`
Expected: PASS — both tests green: `Cache-Control: public, max-age=60, s-maxage=60` present on the `200`, and the conditional request returns `304`.

Fallback (only if the `304` test fails): confirm Express ETag is enabled — `app.getHttpAdapter().getInstance().enabled('etag')` should be truthy; `configureApplication` does not disable it. If for some reason it is off, that is an environment anomaly — report it rather than adding a custom ETag interceptor (out of scope for this plan).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/public/public.controller.ts \
  backend/test/public-cache.e2e-spec.ts
git commit -m "feat(backend): HTTP caching on the public portfolio response

Set Cache-Control: public, max-age=60, s-maxage=60 on
GET /public/users/:userId so browsers/CDNs can cache the rarely-changing
public data; Express's default weak ETag answers conditional
If-None-Match requests with 304. No payload change.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Rate limiting on `/public/*` (IP-based, 429 + Retry-After, guard scoped to `PublicController`, env-driven default 60/60, in-memory store) → Task 1. ✓
- CORS header survives on 429 (publicCors before guard) → Task 1 Step 1 assertion. ✓
- HTTP caching (`Cache-Control` + ETag/304) → Task 2. ✓
- No new endpoints / no payload change / no versioning / no slug → neither task touches `PublicService`, routes, or payload. ✓
- Admin routes un-throttled (no global `APP_GUARD`) → Task 1 wiring + Step 8 regression check. ✓
- `trust proxy` documented, not force-enabled → spec deploy note; nothing in the plan enables it. ✓
- Env documented in `.env.example` → Task 1 Step 6. ✓
- e2e uses low limit deterministically → Task 1 Step 1 sets `PUBLIC_RATE_LIMIT=3` before compile. ✓

**Placeholder scan:** No TBD/TODO; every code step has full content; the Task 2 fallback names an exact check and defers rather than hand-waving. ✓

**Type consistency:** `PublicController` decorators are additive across tasks (Task 1 adds `@UseGuards(ThrottlerGuard)`; Task 2 adds `@Header(...)` + `Header` import) — Task 2's Step 3 shows the full merged file so the two edits compose. `seconds()` used consistently for ms conversion. Env names `PUBLIC_RATE_LIMIT` / `PUBLIC_RATE_TTL` identical in module, `.env.example`, and both specs. ✓
