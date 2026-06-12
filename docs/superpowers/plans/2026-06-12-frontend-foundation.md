# Portfolio Manager Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure Next.js administrative foundation with complete authentication, a real-data dashboard, and end-to-end project CRUD integrated with the existing NestJS API.

**Architecture:** The browser talks only to Next.js Route Handlers, which act as a thin BFF and keep the NestJS JWT in an `HttpOnly` cookie. NestJS remains responsible for authentication, ownership, validation, and persistence; the frontend uses TanStack Query for server state and feature-focused React components for the UI.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod 4, NestJS 11, Prisma 6, PostgreSQL 16, Vitest, React Testing Library, Jest, Supertest, and Playwright.

---

## Reference Documents

- Design: `docs/superpowers/specs/2026-06-12-frontend-foundation-design.md`
- Product specification: `portfolio-manager-spec-completa.md`
- Design-system specification: `portfolio-manager-design-system-spec.md`
- Screen references: `Telas/*.png`
- Source logo: `Logo.png`
- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- Next.js Proxy: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Next.js cookies: https://nextjs.org/docs/app/api-reference/functions/cookies
- Next.js Vitest guide: https://nextjs.org/docs/app/guides/testing/vitest
- shadcn/ui Next.js guide: https://ui.shadcn.com/docs/installation/next
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/installation
- Zod 4: https://zod.dev/
- Playwright: https://playwright.dev/docs/intro

Versions verified on 2026-06-12: Next.js/create-next-app `16.2.9`,
shadcn CLI `4.11.0`, TanStack Query `5.101.0`, Zod `4.4.3`, Vitest `4.1.8`,
and Playwright `1.60.0`. Generated lockfiles remain the source of truth.

## File Structure

Backend files created or substantially changed:

```text
backend/
├── .env.example
├── package.json
├── prisma/
│   ├── e2e-seed.ts
│   ├── schema.prisma
│   └── migrations/20260612000100_scope_project_title_to_user/migration.sql
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── config/application.config.ts
│   ├── common/presenters/image.presenter.ts
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   ├── auth.controller.spec.ts
│       │   ├── email_verification_token.service.ts
│       │   ├── oauth-handoff.ts
│       │   └── guards/google-oauth.guard.ts
│       ├── category/category.controller.ts
│       ├── images/
│       │   ├── images.controller.ts
│       │   ├── images.service.ts
│       │   └── repository/images.repository.ts
│       ├── projects/
│       │   ├── dto/create-project.dto.ts
│       │   ├── dto/update-project.dto.ts
│       │   ├── projects.controller.ts
│       │   ├── projects.service.ts
│       │   ├── projects.service.spec.ts
│       │   └── repository/projects.repository.ts
│       ├── technologies/technologies.controller.ts
│       └── uploads/
│           ├── uploads.controller.ts
│           └── uploads.controller.spec.ts
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

Frontend files are organized by platform concern and product feature:

```text
frontend/
├── .env.example
├── Dockerfile
├── components.json
├── next.config.ts
├── package.json
├── playwright.config.ts
├── vitest.config.mts
├── scripts/generate-brand-assets.mjs
├── public/brand/
│   ├── logo-lockup.svg
│   ├── logo-mark.svg
│   ├── logo-mark-dark.svg
│   └── logo-mark-2048.png
├── e2e/
│   ├── auth.spec.ts
│   ├── global-setup.ts
│   └── projects.spec.ts
└── src/
    ├── proxy.ts
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── favicon.ico
    │   ├── icon.png
    │   ├── apple-icon.png
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   └── verify-email/page.tsx
    │   ├── (dashboard)/
    │   │   ├── layout.tsx
    │   │   ├── dashboard/page.tsx
    │   │   └── projects/
    │   │       ├── page.tsx
    │   │       ├── new/page.tsx
    │   │       └── [id]/edit/page.tsx
    │   └── api/
    │       ├── auth/
    │       ├── categories/route.ts
    │       ├── dashboard/route.ts
    │       ├── images/route.ts
    │       ├── projects/
    │       ├── session/route.ts
    │       ├── technologies/route.ts
    │       └── uploads/route.ts
    ├── components/
    │   ├── feedback/
    │   ├── layout/
    │   └── ui/
    ├── features/
    │   ├── auth/
    │   ├── dashboard/
    │   └── projects/
    ├── lib/
    │   ├── api/
    │   ├── auth/
    │   ├── query/
    │   └── utils.ts
    └── test/
        ├── render-with-providers.tsx
        └── setup.ts
```

## Task 1: Scaffold the Frontend and Test Harness

**Files:**
- Create: `frontend/**` using `create-next-app`
- Create: `frontend/vitest.config.mts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/render-with-providers.tsx`
- Create: `frontend/.env.example`
- Create: `.gitignore`
- Modify: `frontend/package.json`

- [ ] **Step 1: Verify the supported runtime**

Run:

```powershell
node --version
npm --version
```

Expected: Node.js `20.9.0` or newer and a working npm installation.

- [ ] **Step 2: Scaffold Next.js with the approved defaults**

Run from the repository root:

```powershell
npx create-next-app@16.2.9 frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: `frontend/package.json`, `frontend/src/app`, Tailwind, TypeScript, ESLint, and App Router are created.

- [ ] **Step 3: Install runtime and test dependencies**

Run:

```powershell
npm --prefix frontend install @tanstack/react-query react-hook-form @hookform/resolvers zod lucide-react date-fns jose sonner
npm --prefix frontend install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths @playwright/test sharp png-to-ico
```

Expected: both commands exit `0` and update `frontend/package-lock.json`.

- [ ] **Step 4: Initialize shadcn/ui and add only required primitives**

Run:

```powershell
Push-Location frontend
npx shadcn@4.11.0 init -d
npx shadcn@4.11.0 add button card input label textarea select badge table dialog dropdown-menu sheet skeleton separator avatar checkbox command popover sonner tooltip
Pop-Location
```

Expected: `frontend/components.json`, `frontend/src/components/ui/*`, and shared utility files are created.

- [ ] **Step 5: Add the failing test for the shared query test wrapper**

Create `frontend/src/test/render-with-providers.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "./render-with-providers";

describe("renderWithProviders", () => {
  it("renders children inside the application providers", () => {
    renderWithProviders(<p>provider ready</p>);
    expect(screen.getByText("provider ready")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test and verify the missing helper failure**

Run:

```powershell
npm --prefix frontend test -- --run src/test/render-with-providers.test.tsx
```

Expected: FAIL because `render-with-providers` and the Vitest setup do not exist.

- [ ] **Step 7: Create the Vitest configuration and test helpers**

Create `frontend/vitest.config.mts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

Create `frontend/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));
```

Create `frontend/src/test/render-with-providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: TestProviders, ...options });
}
```

Add these scripts to `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 8: Add environment and root ignore rules**

Create `frontend/.env.example`:

```dotenv
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
SESSION_COOKIE_NAME=pm_session
VERIFICATION_COOKIE_NAME=pm_verification
OAUTH_STATE_COOKIE_NAME=pm_oauth_state
```

Create `.gitignore`:

```gitignore
.superpowers/
frontend/node_modules/
frontend/.next/
frontend/coverage/
frontend/playwright-report/
frontend/test-results/
frontend/.env.local
frontend/.env.development.local
frontend/.env.test.local
frontend/.env.production.local
```

- [ ] **Step 9: Run the frontend baseline checks**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
npm --prefix frontend run build
```

Expected: all commands exit `0`.

- [ ] **Step 10: Commit the scaffold**

Run:

```powershell
git add .gitignore frontend
git commit -m "chore(frontend): scaffold Next.js application"
```

## Task 2: Configure NestJS for the Frontend and Stable Auth Contracts

**Files:**
- Create: `backend/.env.example`
- Create: `backend/src/config/application.config.ts`
- Create: `backend/src/config/application.config.spec.ts`
- Create: `backend/src/modules/auth/oauth-handoff.ts`
- Create: `backend/src/modules/auth/oauth-handoff.spec.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/email_verification_token.service.ts`
- Modify: `backend/src/modules/auth/guards/google-oauth.guard.ts`
- Modify: `backend/src/email/email.service.ts`
- Modify: `backend/src/modules/users/users.controller.ts`

- [ ] **Step 1: Write failing tests for origin parsing and OAuth handoff escaping**

Create `backend/src/config/application.config.spec.ts`:

```ts
import { parseAllowedOrigins } from "./application.config";

describe("parseAllowedOrigins", () => {
  it("trims and removes empty origins", () => {
    expect(
      parseAllowedOrigins("http://localhost:3001, https://portfolio.test, "),
    ).toEqual(["http://localhost:3001", "https://portfolio.test"]);
  });
});
```

Create `backend/src/modules/auth/oauth-handoff.spec.ts`:

```ts
import { renderOauthHandoff } from "./oauth-handoff";

describe("renderOauthHandoff", () => {
  it("posts the token and state without placing them in the action URL", () => {
    const html = renderOauthHandoff({
      callbackUrl: "http://localhost:3001/api/auth/google/callback",
      token: "jwt<&",
      state: "state<&",
      nonce: "nonce-value",
    });

    expect(html).toContain('method="post"');
    expect(html).toContain('action="http://localhost:3001/api/auth/google/callback"');
    expect(html).toContain('value="jwt&lt;&amp;"');
    expect(html).toContain('value="state&lt;&amp;"');
    expect(html).not.toContain("?token=");
  });
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```powershell
npm --prefix backend test -- --runInBand application.config.spec.ts oauth-handoff.spec.ts
```

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement pure configuration and handoff helpers**

Create `backend/src/config/application.config.ts`:

```ts
export function parseAllowedOrigins(value?: string): string[] {
  return (value ?? "http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
```

Create `backend/src/modules/auth/oauth-handoff.ts`:

```ts
type OauthHandoffInput = {
  callbackUrl: string;
  token: string;
  state: string;
  nonce: string;
};

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderOauthHandoff(input: OauthHandoffInput): string {
  const callbackUrl = escapeAttribute(input.callbackUrl);
  const token = escapeAttribute(input.token);
  const state = escapeAttribute(input.state);
  const nonce = escapeAttribute(input.nonce);

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Signing in</title></head>
  <body>
    <form id="oauth-handoff" method="post" action="${callbackUrl}">
      <input type="hidden" name="token" value="${token}">
      <input type="hidden" name="state" value="${state}">
      <noscript><button type="submit">Continue</button></noscript>
    </form>
    <script nonce="${nonce}">document.getElementById("oauth-handoff").submit();</script>
  </body>
</html>`;
}
```

- [ ] **Step 4: Make configuration global and enable CORS/static uploads**

Modify `backend/src/app.module.ts` to import `ConfigModule.forRoot({ isGlobal: true })`.

Modify `backend/src/main.ts` so bootstrap includes:

```ts
import { ConfigService } from "@nestjs/config";
import { parseAllowedOrigins } from "./config/application.config";

const configService = app.get(ConfigService);
app.enableCors({
  origin: parseAllowedOrigins(
    configService.get<string>(
      "CORS_ORIGINS",
      configService.get<string>("FRONTEND_URL", "http://localhost:3001"),
    ),
  ),
  credentials: true,
});
app.useGlobalPipes(
  new ValidationPipe({ transform: true, forbidUnknownValues: false }),
);
app.useStaticAssets(join(process.cwd(), "uploads"), {
  prefix: "/uploads/",
});
```

Keep the existing Swagger, public assets, views, and view engine setup.

- [ ] **Step 5: Return an opaque verification token from registration and resend**

Change `generateVerificationToken` to return the expiration with the token:

```ts
type VerificationChallenge = {
  token: string;
  expiresInSeconds: number;
};

type GeneratedVerificationChallenge = VerificationChallenge & {
  code: string;
};
```

At the end of `generateVerificationToken`, return:

```ts
return {
  token,
  code,
  expiresInSeconds: expirationMinutes * 60,
};
```

Change `EmailVerificationService.sendVerificationEmail` and
`resendVerificationEmail` to return `Promise<VerificationChallenge>`.
`sendVerificationEmail` destructures the generated value:

```ts
const { token, code, expiresInSeconds } =
  await this.generateVerificationToken(user_id);
```

After the email sends successfully, return:

```ts
return { token, expiresInSeconds };
```

Update `UsersController.create` to include:

```ts
const verification =
  await this.emailVerificationService.sendVerificationEmail(user.id);

return {
  message:
    "Usuário criado com sucesso! Verifique seu email para ativar a conta.",
  user: {
    id: user.id,
    email: user.email,
    isEmailVerified: false,
    isActive: false,
  },
  verification,
};
```

Update `AuthController.resendVerification` to return the replacement challenge:

```ts
const verification =
  await this.emailVerificationService.resendVerificationEmail(resendDto.email);

return {
  message: "Email de verificação reenviado com sucesso!",
  verification,
};
```

Preserve `HttpException` instances in `UsersController.create`:

```ts
if (e instanceof HttpException) {
  throw e;
}
throw new InternalServerErrorException();
```

- [ ] **Step 6: Point verification emails at the frontend link-consumer route**

In `EmailService.sendVerificationEmail`, construct:

```ts
const frontendUrl = this.configService.get<string>(
  "FRONTEND_URL",
  "http://localhost:3001",
);
const verificationUrl =
  `${frontendUrl}/api/auth/verification-link` +
  `?token=${encodeURIComponent(verificationToken)}` +
  `&email=${encodeURIComponent(email)}`;
```

In `EmailService.createTransporter`, support deterministic test delivery:

```ts
if (this.configService.get<string>("EMAIL_TRANSPORT") === "json") {
  this.transporter = nodemailer.createTransport({ jsonTransport: true });
  return;
}
```

Then retain the existing SMTP transport for non-test environments.

- [ ] **Step 7: Implement OAuth state forwarding and POST handoff**

Change `GoogleOauthGuard` to forward a caller-provided state:

```ts
import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleOauthGuard extends AuthGuard("google") {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const state =
      typeof request.query.state === "string" ? request.query.state : undefined;

    return state ? { state } : {};
  }
}
```

Replace the successful Google callback redirect in `AuthController` with:

```ts
const state = typeof req.query.state === "string" ? req.query.state : "";
if (!state) {
  throw new BadRequestException("Missing OAuth state");
}

const frontendUrl = this.configService.get<string>(
  "FRONTEND_URL",
  "http://localhost:3001",
);
const nonce = randomBytes(16).toString("base64");
const html = renderOauthHandoff({
  callbackUrl: `${frontendUrl}/api/auth/google/callback`,
  token,
  state,
  nonce,
});

res.setHeader(
  "Content-Security-Policy",
  `default-src 'none'; script-src 'nonce-${nonce}'; form-action ${frontendUrl}; base-uri 'none'; frame-ancestors 'none'`,
);
res.type("html").send(html);
```

Inject `ConfigService` into `AuthController` and import `randomBytes` and
`renderOauthHandoff`.

- [ ] **Step 8: Add an authenticated session endpoint**

Add to `AuthController`:

```ts
@Get("me")
@UseGuards(JwtAuthGuard, ActiveUserGuard)
async me(@Request() req) {
  return this.usersService.findOne(Number(req.user.sub));
}
```

Import `ActiveUserGuard` into `AuthController`.

- [ ] **Step 9: Document the required backend environment**

Create `backend/.env.example`:

```dotenv
PORT=3000
DATABASE_URL=postgresql://portfolio:portfolio_pass@localhost:5432/portfolio_db
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRATION=24h
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3001
BACKEND_PUBLIC_URL=http://localhost:3000
EMAIL_TRANSPORT=smtp
EMAIL_HOST_DEV=sandbox.smtp.mailtrap.io
EMAIL_PORT_DEV=2525
EMAIL_USERNAME_DEV=
EMAIL_PASSWORD_DEV=
EMAIL_FROM=Portfolio Manager <noreply@example.com>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

- [ ] **Step 10: Run tests, build, and commit**

Run:

```powershell
npm --prefix backend test -- --runInBand application.config.spec.ts oauth-handoff.spec.ts
npm --prefix backend run build
git add backend
git commit -m "feat(auth): add frontend-safe authentication contracts"
```

Expected: tests and build pass before the commit.

## Task 3: Enforce Project Ownership and Technology Associations

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260612000100_scope_project_title_to_user/migration.sql`
- Modify: `backend/src/modules/projects/dto/create-project.dto.ts`
- Modify: `backend/src/modules/projects/dto/update-project.dto.ts`
- Modify: `backend/src/modules/projects/projects.controller.ts`
- Modify: `backend/src/modules/projects/projects.service.ts`
- Modify: `backend/src/modules/projects/repository/projects.repository.ts`
- Create: `backend/src/modules/projects/projects.service.spec.ts`
- Modify: `backend/src/modules/category/category.controller.ts`
- Modify: `backend/src/modules/technologies/technologies.controller.ts`

- [ ] **Step 1: Write failing service tests for ownership and cover validation**

Create `backend/src/modules/projects/projects.service.spec.ts`:

```ts
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ProjectsService } from "./projects.service";

describe("ProjectsService", () => {
  const repository = {
    findByTitle: jest.fn(),
    findImageById: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = new ProjectsService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it("passes the authenticated owner to project creation", async () => {
    repository.findByTitle.mockResolvedValue(null);
    repository.findImageById.mockResolvedValue({ id: 4, f_userId: 7 });
    repository.create.mockResolvedValue({ id: 1 });

    await service.create(
      {
        title: "Portfolio Manager",
        description: "CMS",
        d_categoryId: 1,
        f_imagesId: 4,
        technologyIds: [2, 3],
      },
      7,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ technologyIds: [2, 3] }),
      7,
    );
    expect(repository.findByTitle).toHaveBeenCalledWith(
      "Portfolio Manager",
      7,
    );
  });

  it("rejects a cover image owned by another user", async () => {
    repository.findByTitle.mockResolvedValue(null);
    repository.findImageById.mockResolvedValue({ id: 4, f_userId: 9 });

    await expect(
      service.create(
        {
          title: "Portfolio Manager",
          description: "CMS",
          d_categoryId: 1,
          f_imagesId: 4,
        },
        7,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns not found when the project does not belong to the user", async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne(5, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
```

- [ ] **Step 2: Run the test and verify signature failures**

Run:

```powershell
npm --prefix backend test -- --runInBand projects.service.spec.ts
```

Expected: FAIL because service and repository methods are not user-scoped.

- [ ] **Step 3: Make project titles unique per owner**

In `backend/prisma/schema.prisma`, remove `@unique` from
`f_projects.title` and add:

```prisma
@@unique([f_userId, title])
```

Create
`backend/prisma/migrations/20260612000100_scope_project_title_to_user/migration.sql`:

```sql
DROP INDEX IF EXISTS "f_projects_title_key";
CREATE UNIQUE INDEX "f_projects_f_userId_title_key"
ON "f_projects"("f_userId", "title");
```

- [ ] **Step 4: Replace project DTOs with validated contracts**

Set `backend/src/modules/projects/dto/create-project.dto.ts` to:

```ts
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  repo_url?: string;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  live_url?: string;

  @IsInt()
  d_categoryId: number;

  @IsInt()
  @IsOptional()
  f_imagesId?: number;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsOptional()
  technologyIds?: number[];
}
```

Set `backend/src/modules/projects/dto/update-project.dto.ts` to:

```ts
import { PartialType } from "@nestjs/swagger";
import { CreateProjectDto } from "./create-project.dto";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
```

- [ ] **Step 5: Scope repository operations and map technology relations**

Use `findFirst({ where: { id, f_userId: userId } })` for detail access and
`findMany({ where: { f_userId: userId } })` for lists.

The create implementation must use:

```ts
  async create(data: CreateProjectDto, userId: number) {
  const { technologyIds = [], ...project } = data;

  return this.prismaService.f_projects.create({
    data: {
      ...project,
      f_userId: userId,
      technologies: {
        connect: technologyIds.map((id) => ({ id })),
      },
    },
    include: this.projectInclude,
  });
}
```

The update implementation must use `set` so removed technologies are
disconnected:

```ts
async update(id: number, userId: number, data: UpdateProjectDto) {
  const { technologyIds, ...project } = data;

  return this.prismaService.f_projects.update({
    where: { id, f_userId: userId },
    data: {
      ...project,
      ...(technologyIds
        ? { technologies: { set: technologyIds.map((techId) => ({ id: techId })) } }
        : {}),
    },
    include: this.projectInclude,
  });
}
```

Define one reusable include object containing `category`, `technologies`, and
`f_images`, and add:

```ts
findImageById(id: number) {
  return this.prismaService.f_images.findUnique({ where: { id } });
}
```

Change title lookup to:

```ts
findByTitle(title: string, userId: number) {
  return this.prismaService.f_projects.findFirst({
    where: { title, f_userId: userId },
    include: this.projectInclude,
  });
}
```

- [ ] **Step 6: Implement service ownership checks**

Change service signatures to include `userId`:

```ts
create(dto: CreateProjectDto, userId: number)
findAll(userId: number)
findOne(id: number, userId: number)
update(id: number, dto: UpdateProjectDto, userId: number)
delete(id: number, userId: number)
```

Create checks `findByTitle(dto.title, userId)`. Update performs the same check
when `dto.title` is present and throws `ConflictException` only when the found
project ID differs from the project being edited.

Before create or update with a cover:

```ts
const image = await this.projectRepository.findImageById(dto.f_imagesId);
if (!image || image.f_userId !== userId) {
  throw new ForbiddenException("Cover image does not belong to the user");
}
```

Use `NotFoundException("Project Not Found")` when a user-scoped lookup returns
`null`.

- [ ] **Step 7: Apply guards consistently and derive owner from JWT**

Set class-level guards on `ProjectsController`:

```ts
@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller("projects")
export class ProjectsController {}
```

Every action must call the service with `Number(req.user.sub)`. Do not accept
`f_userId` from any request body. Ensure `DELETE /projects/:id` is guarded.

Replace the class-level technology guards with:

```ts
@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller("technologies")
```

`UserOwnershipGuard` must not run on collection routes because they have no
user ID route parameter. Apply the same `JwtAuthGuard` and `ActiveUserGuard`
pair to `CategoryController` so project lookups are authenticated.

- [ ] **Step 8: Generate Prisma client, run tests, and commit**

Run:

```powershell
npm --prefix backend run prisma:dev:generate
npm --prefix backend test -- --runInBand projects.service.spec.ts
npm --prefix backend run build
git add backend/prisma backend/src/modules/projects
git commit -m "feat(projects): enforce ownership and technology links"
```

Expected: Prisma generation, tests, and build pass.

## Task 4: Secure Images and Uploads and Return Public URLs

**Files:**
- Create: `backend/src/common/presenters/image.presenter.ts`
- Create: `backend/src/common/presenters/image.presenter.spec.ts`
- Modify: `backend/src/modules/images/images.controller.ts`
- Modify: `backend/src/modules/images/images.service.ts`
- Modify: `backend/src/modules/images/repository/images.repository.ts`
- Modify: `backend/src/modules/uploads/uploads.controller.ts`
- Create: `backend/src/modules/uploads/uploads.controller.spec.ts`
- Modify: `backend/src/modules/projects/repository/projects.repository.ts`

- [ ] **Step 1: Write failing presenter and upload-authorization tests**

Create `backend/src/common/presenters/image.presenter.spec.ts`:

```ts
import { presentImage } from "./image.presenter";

describe("presentImage", () => {
  it("returns a public URL without leaking the filesystem path", () => {
    const result = presentImage(
      {
        id: 9,
        description: null,
        src_path: "D:\\app\\uploads\\7\\cover.png",
        f_userId: 7,
        created_at: new Date("2026-01-01T00:00:00Z"),
        updated_at: new Date("2026-01-01T00:00:00Z"),
      },
      "http://localhost:3000",
    );

    expect(result.url).toBe("http://localhost:3000/uploads/7/cover.png");
    expect(result).not.toHaveProperty("src_path");
  });
});
```

Create `backend/src/modules/uploads/uploads.controller.spec.ts` with a mocked
`ImagesService` and these assertions:

```ts
it("allows a regular user to upload to their own account", async () => {
  await expect(
    controller.uploadImage(
      7,
      { filename: "cover.png", path: "uploads/7/cover.png" } as never,
      { user: { sub: "7", role: "2", status: "2" } } as never,
    ),
  ).resolves.toBeDefined();
});

it("rejects a regular user uploading to another account", async () => {
  await expect(
    controller.uploadImage(
      8,
      { filename: "cover.png", path: "uploads/8/cover.png" } as never,
      { user: { sub: "7", role: "2", status: "2" } } as never,
    ),
  ).rejects.toBeInstanceOf(ForbiddenException);
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```powershell
npm --prefix backend test -- --runInBand image.presenter.spec.ts uploads.controller.spec.ts
```

Expected: FAIL because the presenter is absent and the ownership condition is
incorrect.

- [ ] **Step 3: Implement the image presenter**

Create `backend/src/common/presenters/image.presenter.ts`:

```ts
import { basename } from "path";
import type { f_images } from "@prisma/client";

export function presentImage(image: f_images, publicBaseUrl: string) {
  return {
    id: image.id,
    description: image.description,
    url: new URL(
      `/uploads/${image.f_userId}/${basename(image.src_path)}`,
      publicBaseUrl,
    ).toString(),
    created_at: image.created_at,
    updated_at: image.updated_at,
  };
}
```

- [ ] **Step 4: Make image listing user-scoped**

Protect `ImagesController` with `JwtAuthGuard` and `ActiveUserGuard`.

Replace the unscoped list with:

```ts
@Get()
async findMine(@Req() req: AuthenticatedRequest) {
  return this.imagesService.findByUser(Number(req.user.sub));
}
```

Remove the public `GET /images/user/:id` route. Keep `GET /images/:id`, but
make it call:

```ts
@Get(":id")
async findOne(
  @Param("id", ParseIntPipe) id: number,
  @Req() req: AuthenticatedRequest,
) {
  return this.imagesService.findOwned(id, Number(req.user.sub));
}
```

Split service access into an owned public method and a raw internal method:

```ts
async findOwned(id: number, userId: number) {
  const image = await this.imagesRepository.findById(id);
  if (!image || image.f_userId !== userId) {
    throw new NotFoundException("Image not found");
  }
  return this.present(image);
}

async findEntity(id: number) {
  return this.imagesRepository.findById(id);
}
```

Map all image responses through `presentImage`, using `BACKEND_PUBLIC_URL`
from `ConfigService`.

- [ ] **Step 5: Correct upload authorization and enforce 5 MB**

In `UploadsController`, correct the ownership condition:

```ts
if (Number(sub) !== userId && Number(role) !== UserRoles.SYSADMIN) {
  throw new ForbiddenException(
    "You can only upload images to your own account.",
  );
}
```

Remove `UserOwnershipGuard` from the controller-level upload guards. The
controller must use only:

```ts
@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller("upload")
```

The explicit owner/admin checks in upload and delete actions remain the
authorization source for image resources.

Add Multer limits:

```ts
limits: {
  fileSize: 5 * 1024 * 1024,
},
```

Reject missing files before saving:

```ts
if (!file) {
  throw new BadRequestException("Image file is required");
}
```

Store a stable relative path:

```ts
src_path: join("uploads", String(userId), file.filename),
```

Return the presented image rather than the raw Prisma record.

Update upload deletion to use the raw internal method:

```ts
const image = await this.imagesService.findEntity(imageId);
```

Keep the owner/admin authorization check, then call
`this.imagesService.delete(imageId)`.

- [ ] **Step 6: Stop leaking image paths from project queries**

Project repository queries may still include the Prisma image relation
internally, but `ProjectsService` must map `f_images` with `presentImage` before
returning list, detail, create, or update responses.

Inject `ConfigService` into `ProjectsService` and use:

```ts
private presentProject(project: ProjectWithRelations) {
  return {
    ...project,
    f_images: project.f_images
      ? presentImage(
          project.f_images,
          this.configService.get("BACKEND_PUBLIC_URL", "http://localhost:3000"),
        )
      : null,
  };
}
```

- [ ] **Step 7: Run tests, build, and commit**

Run:

```powershell
npm --prefix backend test -- --runInBand image.presenter.spec.ts uploads.controller.spec.ts projects.service.spec.ts
npm --prefix backend run build
git add backend/src/common backend/src/modules/images backend/src/modules/uploads backend/src/modules/projects
git commit -m "fix(media): secure uploads and expose stable image URLs"
```

## Task 5: Create Brand Assets and Design Tokens

**Files:**
- Create: `frontend/public/brand/logo-mark.svg`
- Create: `frontend/public/brand/logo-mark-dark.svg`
- Create: `frontend/public/brand/logo-lockup.svg`
- Create: `frontend/scripts/generate-brand-assets.mjs`
- Create: generated PNG and favicon files
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/package.json`

- [ ] **Step 1: Create the clean vector mark**

Create `frontend/public/brand/logo-mark.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none">
  <path d="M128 18 222 72v112l-94 54-94-54V72l94-54Z" stroke="#E4E4E7" stroke-width="18" stroke-linejoin="round"/>
  <path d="M79 177V82l49-28 49 28v45" stroke="#FAFAFA" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M79 122l49-28 30 17" stroke="#FAFAFA" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M111 188v-65l34 42 34-66v78" stroke="#22C55E" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m177 99 24 14-24 14" fill="#22C55E"/>
</svg>
```

Create `frontend/public/brand/logo-mark-dark.svg` with the same geometry,
changing the outer stroke to `#FFFFFF`.

Create `frontend/public/brand/logo-lockup.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" fill="none">
  <g transform="translate(8 8) scale(.56)">
    <path d="M128 18 222 72v112l-94 54-94-54V72l94-54Z" stroke="#E4E4E7" stroke-width="18" stroke-linejoin="round"/>
    <path d="M79 177V82l49-28 49 28v45" stroke="#FAFAFA" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M79 122l49-28 30 17" stroke="#FAFAFA" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M111 188v-65l34 42 34-66v78" stroke="#22C55E" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="m177 99 24 14-24 14" fill="#22C55E"/>
  </g>
  <text x="175" y="93" fill="#FAFAFA" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="700">Portfolio Manager</text>
  <rect x="520" y="56" width="88" height="40" rx="12" fill="#052E16" stroke="#166534"/>
  <text x="541" y="82" fill="#4ADE80" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600">v1.0.0</text>
</svg>
```

- [ ] **Step 2: Add deterministic asset generation**

Create `frontend/scripts/generate-brand-assets.mjs`:

```js
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = process.cwd();
const source = path.join(root, "public", "brand", "logo-mark.svg");
const appDir = path.join(root, "src", "app");
const brandDir = path.join(root, "public", "brand");
const svg = await readFile(source);

const render = (size) =>
  sharp(svg).resize(size, size, { fit: "contain" }).png().toBuffer();

const png2048 = await render(2048);
const icon512 = await render(512);
const apple180 = await render(180);
const favicon16 = await render(16);
const favicon32 = await render(32);
const favicon48 = await render(48);

await writeFile(path.join(brandDir, "logo-mark-2048.png"), png2048);
await writeFile(path.join(appDir, "icon.png"), icon512);
await writeFile(path.join(appDir, "apple-icon.png"), apple180);
await writeFile(
  path.join(appDir, "favicon.ico"),
  await pngToIco([favicon16, favicon32, favicon48]),
);
```

Add to `frontend/package.json`:

```json
{
  "scripts": {
    "brand:generate": "node scripts/generate-brand-assets.mjs"
  }
}
```

- [ ] **Step 3: Generate and inspect all brand outputs**

Run:

```powershell
npm --prefix frontend run brand:generate
```

Expected files:

```text
frontend/public/brand/logo-mark-2048.png
frontend/src/app/icon.png
frontend/src/app/apple-icon.png
frontend/src/app/favicon.ico
```

Open the 2048 PNG and 32px favicon for visual inspection. Confirm genuine
transparent corners, recognizable `P`/`M` geometry, and no checkerboard.

- [ ] **Step 4: Apply the approved tokens and fonts**

In `frontend/src/app/layout.tsx`, load Inter and JetBrains Mono through
`next/font/google`, expose `--font-sans` and `--font-mono`, set
`<html lang="en" className="dark">`, and define metadata:

```ts
export const metadata: Metadata = {
  title: {
    default: "Portfolio Manager",
    template: "%s | Portfolio Manager",
  },
  description: "Open-source CMS for managing a professional portfolio.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};
```

In `frontend/src/app/globals.css`, set the shadcn CSS variables to the approved
dark palette:

```css
:root {
  --background: #09090b;
  --foreground: #fafafa;
  --card: #18181b;
  --card-foreground: #fafafa;
  --popover: #1f1f23;
  --popover-foreground: #fafafa;
  --primary: #22c55e;
  --primary-foreground: #09090b;
  --secondary: #1f1f23;
  --secondary-foreground: #fafafa;
  --muted: #111113;
  --muted-foreground: #a1a1aa;
  --accent: #111113;
  --accent-foreground: #fafafa;
  --destructive: #ef4444;
  --border: #2a2a30;
  --input: #2a2a30;
  --ring: #22c55e;
  --radius: 0.625rem;
}
```

Set body background, text color, font, and a subtle radial green glow without
large gradients.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
git add frontend/public frontend/scripts frontend/src/app frontend/package.json frontend/package-lock.json
git commit -m "feat(brand): add Portfolio Manager visual identity"
```

## Task 6: Implement BFF API and Session Primitives

**Files:**
- Create: `frontend/src/lib/api/types.ts`
- Create: `frontend/src/lib/api/errors.ts`
- Create: `frontend/src/lib/api/errors.test.ts`
- Create: `frontend/src/lib/api/backend.ts`
- Create: `frontend/src/lib/api/bff.ts`
- Create: `frontend/src/lib/auth/cookies.ts`
- Create: `frontend/src/lib/auth/session.ts`
- Create: `frontend/src/lib/auth/session.test.ts`
- Create: `frontend/src/lib/auth/verification.ts`
- Create: `frontend/src/lib/query/query-provider.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/src/proxy.ts`

- [ ] **Step 1: Write failing tests for error normalization and cookie options**

Create `frontend/src/lib/api/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeApiError } from "./errors";

describe("normalizeApiError", () => {
  it("preserves backend status, code, and message", () => {
    expect(
      normalizeApiError(401, {
        message: "Email is not verified",
        code: "EMAIL_NOT_VERIFIED",
      }),
    ).toEqual({
      status: 401,
      code: "EMAIL_NOT_VERIFIED",
      message: "Email is not verified",
    });
  });

  it("uses a stable fallback for unknown payloads", () => {
    expect(normalizeApiError(500, null)).toEqual({
      status: 500,
      message: "Unexpected server error",
    });
  });
});
```

Create `frontend/src/lib/auth/session.test.ts`:

```ts
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { sessionCookieOptions, sessionMaxAge } from "./session";

describe("sessionCookieOptions", () => {
  it("uses HttpOnly, SameSite Lax, and root path", () => {
    expect(sessionCookieOptions(false, 3600)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 3600,
    });
  });

  it("aligns cookie lifetime with the JWT expiration", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(new TextEncoder().encode("test-secret"));

    expect(sessionMaxAge(token, now)).toBe(3600);
  });
});
```

- [ ] **Step 2: Run tests and verify missing-module failures**

Run:

```powershell
npm --prefix frontend test -- --run src/lib/api/errors.test.ts src/lib/auth/session.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the stable API error type**

Create `frontend/src/lib/api/types.ts`:

```ts
export type ApiError = {
  status: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
```

Create `frontend/src/lib/api/errors.ts`:

```ts
import type { ApiError } from "./types";

export function normalizeApiError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const rawMessage = value.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : typeof rawMessage === "string"
        ? rawMessage
        : status >= 500
          ? "Unexpected server error"
          : "Request failed";

    return {
      status,
      ...(typeof value.code === "string" ? { code: value.code } : {}),
      message,
    };
  }

  return {
    status,
    message: status >= 500 ? "Unexpected server error" : "Request failed",
  };
}
```

- [ ] **Step 4: Implement server-only backend forwarding**

Create `frontend/src/lib/api/backend.ts`:

```ts
import "server-only";
import { cookies } from "next/headers";

export async function backendFetch(
  path: string,
  init: RequestInit = {},
  authenticated = true,
) {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  if (authenticated) {
    const token = (await cookies()).get(
      process.env.SESSION_COOKIE_NAME ?? "pm_session",
    )?.value;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  return fetch(`${process.env.BACKEND_URL ?? "http://localhost:3000"}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
```

Create `frontend/src/lib/api/bff.ts`:

```ts
import { NextResponse } from "next/server";
import { normalizeApiError } from "./errors";
import { clearSessionCookie } from "@/lib/auth/session";

export async function toBffResponse(response: Response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      await clearSessionCookie();
    }
    return NextResponse.json(normalizeApiError(response.status, payload), {
      status: response.status,
    });
  }

  return NextResponse.json(payload, { status: response.status });
}
```

- [ ] **Step 5: Implement session and verification cookies**

Create `frontend/src/lib/auth/cookies.ts`:

```ts
export const SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME ?? "pm_session";
export const VERIFICATION_COOKIE =
  process.env.VERIFICATION_COOKIE_NAME ?? "pm_verification";
export const OAUTH_STATE_COOKIE =
  process.env.OAUTH_STATE_COOKIE_NAME ?? "pm_oauth_state";
```

Create `frontend/src/lib/auth/session.ts`:

```ts
import "server-only";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./cookies";

export function sessionMaxAge(
  token: string,
  now = Math.floor(Date.now() / 1000),
) {
  const expiration = decodeJwt(token).exp;
  return expiration ? Math.max(0, expiration - now) : 60 * 60;
}

export function sessionCookieOptions(production: boolean, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: production,
    path: "/",
    maxAge,
  };
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(
      process.env.NODE_ENV === "production",
      sessionMaxAge(token),
    ),
  );
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(process.env.NODE_ENV === "production", 0),
    maxAge: 0,
  });
}
```

Create `frontend/src/lib/auth/verification.ts`:

```ts
import "server-only";
import { cookies } from "next/headers";
import { VERIFICATION_COOKIE } from "./cookies";

type VerificationContext = {
  token: string;
  email: string;
};

const options = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 600,
};

export async function setVerificationContext(
  context: VerificationContext,
) {
  (await cookies()).set(
    VERIFICATION_COOKIE,
    JSON.stringify(context),
    options,
  );
}

export async function readVerificationContext() {
  const value = (await cookies()).get(VERIFICATION_COOKIE)?.value;
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<VerificationContext>;
    return typeof parsed.token === "string" && typeof parsed.email === "string"
      ? { token: parsed.token, email: parsed.email }
      : null;
  } catch {
    return null;
  }
}

export async function clearVerificationContext() {
  (await cookies()).set(VERIFICATION_COOKIE, "", {
    ...options,
    maxAge: 0,
  });
}
```

The browser never receives the token in a JSON response.

- [ ] **Step 6: Add the query provider**

Create `frontend/src/lib/query/query-provider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

Wrap root-layout children with `QueryProvider` and render the shadcn `Toaster`.

- [ ] **Step 7: Add lightweight route protection with Next.js Proxy**

Create `frontend/src/proxy.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/projects"];
const authPaths = ["/login", "/register", "/verify-email"];

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(
    process.env.SESSION_COOKIE_NAME ?? "pm_session",
  );
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/login", "/register", "/verify-email"],
};
```

- [ ] **Step 8: Run tests and commit**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
git add frontend/src/lib frontend/src/proxy.ts frontend/src/app/layout.tsx
git commit -m "feat(frontend): add BFF and secure session primitives"
```

## Task 7: Implement Authentication Route Handlers

**Files:**
- Create: `frontend/src/app/api/auth/login/route.ts`
- Create: `frontend/src/app/api/auth/register/route.ts`
- Create: `frontend/src/app/api/auth/verify-email/route.ts`
- Create: `frontend/src/app/api/auth/resend-verification/route.ts`
- Create: `frontend/src/app/api/auth/verification-link/route.ts`
- Create: `frontend/src/app/api/auth/google/start/route.ts`
- Create: `frontend/src/app/api/auth/google/callback/route.ts`
- Create: `frontend/src/app/api/auth/logout/route.ts`
- Create: `frontend/src/app/api/session/route.ts`
- Create: `frontend/src/app/api/auth/login/route.test.ts`
- Create: `frontend/src/app/api/auth/google/callback/route.test.ts`

- [ ] **Step 1: Write failing handler tests**

Mock `backendFetch`, cookie helpers, and `crypto.randomUUID`. Assert:

```ts
it("stores the access token and omits it from the login response", async () => {
  const response = await POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@email.com",
        password: "StrongP@ss1",
      }),
    }),
  );
  expect(await response.json()).toEqual(
    expect.objectContaining({ user: expect.any(Object) }),
  );
  expect(setSessionCookie).toHaveBeenCalledWith("jwt-token");
});
```

For Google callback, assert mismatched state returns `400`, matching state sets
the session cookie, clears the state cookie, and redirects to `/dashboard`.

- [ ] **Step 2: Run handler tests and verify failure**

Run:

```powershell
npm --prefix frontend test -- --run src/app/api/auth/login/route.test.ts src/app/api/auth/google/callback/route.test.ts
```

Expected: FAIL because the handlers are absent.

- [ ] **Step 3: Implement login, logout, and session handlers**

`POST /api/auth/login` forwards credentials to `/auth/login`, stores
`access_token` through `setSessionCookie`, removes it from the returned JSON,
and preserves `EMAIL_NOT_VERIFIED`.

Create `frontend/src/app/api/auth/login/route.ts`:

```ts
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { normalizeApiError } from "@/lib/api/errors";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const credentials = await request.json();
  const response = await backendFetch(
    "/auth/login",
    { method: "POST", body: JSON.stringify(credentials) },
    false,
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      normalizeApiError(response.status, payload),
      { status: response.status },
    );
  }

  await setSessionCookie(payload.access_token);
  return NextResponse.json({
    message: payload.message,
    user: payload.user,
  });
}
```

Create `frontend/src/app/api/auth/logout/route.ts`:

```ts
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  return new Response(null, { status: 204 });
}
```

Create `frontend/src/app/api/session/route.ts`:

```ts
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

export async function GET() {
  return toBffResponse(await backendFetch("/auth/me"));
}
```

- [ ] **Step 4: Implement registration and verification challenge handlers**

`POST /api/auth/register` forwards to `/users`, stores
`payload.verification.token` and `payload.user.email` in the verification
cookie. Its success branch returns only:

```ts
return NextResponse.json(
  {
    message: payload.message,
    email: payload.user.email,
    expiresInSeconds: payload.verification.expiresInSeconds,
  },
  { status: 201 },
);
```

`POST /api/auth/verify-email` reads the token from the verification cookie,
forwards `{ token, code }`, clears the cookie on success, and rejects absent
context with `400`. Use this exact core:

```ts
const context = await readVerificationContext();
if (!context) {
  return NextResponse.json(
    { status: 400, message: "Verification session expired" },
    { status: 400 },
  );
}
const { code } = await request.json();
const response = await backendFetch(
  "/auth/verify-email",
  {
    method: "POST",
    body: JSON.stringify({ token: context.token, code }),
  },
  false,
);
if (response.ok) {
  await clearVerificationContext();
}
return toBffResponse(response);
```

`POST /api/auth/resend-verification` forwards the email, replaces the
verification cookie with the new token, and omits the token from JSON.

`GET /api/auth/verification-link` validates `token` and `email`, sets the
verification cookie, and redirects to `/verify-email`:

```ts
const url = new URL(request.url);
const token = url.searchParams.get("token");
const email = url.searchParams.get("email");
if (!token || !email) {
  return NextResponse.redirect(new URL("/login?verification=invalid", url));
}
await setVerificationContext({ token, email });
return NextResponse.redirect(
  new URL(`/verify-email?email=${encodeURIComponent(email)}`, url),
);
```

- [ ] **Step 5: Implement Google start and callback handlers**

`GET /api/auth/google/start`:

```ts
const state = crypto.randomUUID();
cookieStore.set(OAUTH_STATE_COOKIE, state, {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 600,
});
return NextResponse.redirect(
  `${process.env.BACKEND_URL}/auth/google?state=${encodeURIComponent(state)}`,
);
```

`POST /api/auth/google/callback` reads form data, compares its `state` with the
state cookie using exact string equality, sets the session cookie, expires the
state cookie, and redirects to `/dashboard`. Reject missing or mismatched
values with `400`. Its core is:

```ts
const form = await request.formData();
const token = form.get("token");
const state = form.get("state");
const cookieStore = await cookies();
const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

if (
  typeof token !== "string" ||
  typeof state !== "string" ||
  !expectedState ||
  state !== expectedState
) {
  return NextResponse.json(
    { status: 400, message: "Invalid OAuth handoff" },
    { status: 400 },
  );
}

await setSessionCookie(token);
cookieStore.set(OAUTH_STATE_COOKIE, "", {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 0,
});
return NextResponse.redirect(new URL("/dashboard", request.url), 303);
```

- [ ] **Step 6: Run tests, lint, and commit**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
git add frontend/src/app/api/auth frontend/src/app/api/session
git commit -m "feat(auth): implement Next.js authentication gateway"
```

## Task 8: Build Authentication Screens

**Files:**
- Create: `frontend/src/features/auth/schemas.ts`
- Create: `frontend/src/features/auth/schemas.test.ts`
- Create: `frontend/src/features/auth/components/auth-shell.tsx`
- Create: `frontend/src/features/auth/components/login-form.tsx`
- Create: `frontend/src/features/auth/components/register-form.tsx`
- Create: `frontend/src/features/auth/components/verification-form.tsx`
- Create: `frontend/src/app/(auth)/layout.tsx`
- Create: `frontend/src/app/(auth)/login/page.tsx`
- Create: `frontend/src/app/(auth)/register/page.tsx`
- Create: `frontend/src/app/(auth)/verify-email/page.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Write failing schema tests matching backend constraints**

Create `frontend/src/features/auth/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loginSchema, registrationSchema, verificationSchema } from "./schemas";

describe("authentication schemas", () => {
  it("rejects a password without uppercase, number, and special character", () => {
    const result = registrationSchema.safeParse({
      username: "jumael",
      email: "jumael@example.com",
      password: "password",
      confirmPassword: "password",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid login", () => {
    expect(
      loginSchema.safeParse({
        email: "jumael@example.com",
        password: "StrongP@ss1",
      }).success,
    ).toBe(true);
  });

  it("requires exactly six digits for verification", () => {
    expect(verificationSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(verificationSchema.safeParse({ code: "12345" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
npm --prefix frontend test -- --run src/features/auth/schemas.test.ts
```

Expected: FAIL because schemas are missing.

- [ ] **Step 3: Implement authentication schemas**

Create `frontend/src/features/auth/schemas.ts`:

```ts
import { z } from "zod";

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Add one uppercase letter")
  .regex(/\d/, "Add one number")
  .regex(/[@$!%*?&]/, "Add one special character");

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registrationSchema = z
  .object({
    username: z.string().min(3).max(40),
    email: z.email("Enter a valid email"),
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const verificationSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code"),
});
```

- [ ] **Step 4: Build the shared authentication shell**

Create `auth-shell.tsx` as a responsive two-column layout matching
`Telas/LoginPage.png`:

- Left: logo lockup, heading, three concise product benefits, and open-source
  footer.
- Right: bordered authentication card.
- Mobile: hide the benefit column and center the card.
- No animated 3D logo or generated illustration.

Use semantic headings, labels, and a `main` landmark.

Use this component boundary:

```tsx
import Image from "next/image";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1440px] overflow-hidden rounded-2xl border bg-[#0B1016] lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden border-r p-12 lg:flex lg:flex-col">
          <Image
            src="/brand/logo-lockup.svg"
            alt="Portfolio Manager"
            width={320}
            height={80}
            priority
          />
          <div className="my-auto max-w-xl">
            <h1 className="text-5xl font-bold leading-tight">
              Manage your professional portfolio{" "}
              <span className="text-primary">with confidence</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Open-source CMS for developers to build, manage, and showcase
              projects, skills, and achievements.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Open-source CMS for developers
          </p>
        </section>
        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-xl">{children}</div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Implement login**

`login-form.tsx` uses React Hook Form with `zodResolver(loginSchema)`.
On success, call `router.replace(next ?? "/dashboard")` and `router.refresh()`.
On `EMAIL_NOT_VERIFIED`, redirect to:

```ts
router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
```

The Google button navigates to `/api/auth/google/start`.

Use this submission function:

```ts
async function submit(values: LoginValues) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(values),
  });
  const payload = await response.json();

  if (!response.ok) {
    if (payload.code === "EMAIL_NOT_VERIFIED") {
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      return;
    }
    form.setError("root", { message: payload.message });
    return;
  }

  router.replace(nextPath ?? "/dashboard");
  router.refresh();
}
```

The page title and copy are:

```text
Portfolio Manager
Welcome back! Please sign in to your account.
```

- [ ] **Step 6: Implement registration and verification**

Registration submits without `confirmPassword`, then redirects to
`/verify-email?email=<encoded>`.

The request body is exact:

```ts
const { confirmPassword: _confirmPassword, ...registration } = values;
await fetch("/api/auth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(registration),
});
```

Verification:

- Displays the email from the query string.
- Uses a single six-digit input with numeric input mode.
- Submits to `/api/auth/verify-email`.
- Supports resend through `/api/auth/resend-verification`.
- Shows the two-minute resend cooldown returned by backend errors without
  discarding the entered code.
- Redirects to `/login?verified=1` after success.

The verification submit sends only the code:

```ts
await fetch("/api/auth/verify-email", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ code: values.code }),
});
```

- [ ] **Step 7: Make the root route session-aware**

Set `frontend/src/app/page.tsx` to:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

export default async function Home() {
  const hasSession = (await cookies()).has(SESSION_COOKIE);
  redirect(hasSession ? "/dashboard" : "/login");
}
```

- [ ] **Step 8: Add focused component tests**

Test that:

- Login renders accessible email/password fields.
- Registration displays all password requirement failures.
- Verification accepts only six digits.
- `EMAIL_NOT_VERIFIED` redirects to verification.
- Submit buttons disable while requests are pending.

Use `renderWithProviders` and mock `global.fetch`.

- [ ] **Step 9: Verify and commit**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
npm --prefix frontend run build
git add frontend/src/app frontend/src/features/auth
git commit -m "feat(auth): add complete authentication experience"
```

## Task 9: Build the Responsive Administrative Shell

**Files:**
- Create: `frontend/src/components/layout/navigation.ts`
- Create: `frontend/src/components/layout/app-sidebar.tsx`
- Create: `frontend/src/components/layout/app-header.tsx`
- Create: `frontend/src/components/layout/mobile-navigation.tsx`
- Create: `frontend/src/components/layout/user-menu.tsx`
- Create: `frontend/src/components/layout/admin-shell.tsx`
- Create: `frontend/src/components/layout/admin-shell.test.tsx`
- Create: `frontend/src/features/auth/api/use-session.ts`
- Create: `frontend/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Write the failing navigation test**

Create `admin-shell.test.tsx` and assert:

```ts
expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
  "href",
  "/dashboard",
);
expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
  "href",
  "/projects",
);
expect(screen.getByText("Soon")).toBeInTheDocument();
```

Also assert the mobile menu button has an accessible name.

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
npm --prefix frontend test -- --run src/components/layout/admin-shell.test.tsx
```

Expected: FAIL because the shell does not exist.

- [ ] **Step 3: Define navigation as data**

Create `navigation.ts` with four groups. Only Dashboard and Projects have
enabled `href` values. Every other item has `disabled: true` and label `Soon`.
Use the Lucide icons listed in the approved design-system specification.

- [ ] **Step 4: Build desktop sidebar and mobile drawer**

Desktop sidebar:

- Fixed 260px width.
- Logo lockup at top.
- Group labels in uppercase 12px text.
- Active route with green left border and elevated background.
- Disabled items use `aria-disabled="true"` and cannot receive navigation.

Mobile navigation uses the shadcn `Sheet`, traps focus, closes on navigation,
and restores focus to the menu button.

- [ ] **Step 5: Build header and user session query**

Create `use-session.ts` using TanStack Query against `/api/session`.

Header content:

- Mobile menu trigger.
- Disabled global search with tooltip `Global search is coming soon`.
- `View Public Site` button pointing to `/public-preview` but disabled with a
  `Soon` badge in this milestone.
- User avatar fallback, username/email, and sign-out menu.

Sign-out posts to `/api/auth/logout`, clears the query cache, and navigates to
`/login`.

- [ ] **Step 6: Compose the shell**

Create `admin-shell.tsx`:

```tsx
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppSidebar />
      <div className="lg:pl-[260px]">
        <AppHeader />
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

Use it from `frontend/src/app/(dashboard)/layout.tsx`.

- [ ] **Step 7: Verify responsive behavior and commit**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
npm --prefix frontend run build
git add frontend/src/components/layout frontend/src/features/auth/api frontend/src/app/'(dashboard)'/layout.tsx
git commit -m "feat(frontend): add responsive administrative shell"
```

## Task 10: Implement the Real-Data Dashboard

**Files:**
- Create: `frontend/src/features/dashboard/types.ts`
- Create: `frontend/src/features/dashboard/server/build-dashboard.ts`
- Create: `frontend/src/features/dashboard/server/build-dashboard.test.ts`
- Create: `frontend/src/app/api/dashboard/route.ts`
- Create: `frontend/src/features/dashboard/api/use-dashboard.ts`
- Create: `frontend/src/features/dashboard/components/metric-card.tsx`
- Create: `frontend/src/features/dashboard/components/recent-projects.tsx`
- Create: `frontend/src/features/dashboard/components/quick-actions.tsx`
- Create: `frontend/src/features/dashboard/components/dashboard-view.tsx`
- Create: `frontend/src/components/feedback/empty-state.tsx`
- Create: `frontend/src/components/feedback/error-state.tsx`
- Create: `frontend/src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Write a failing aggregation test**

Create `build-dashboard.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildDashboard } from "./build-dashboard";

describe("buildDashboard", () => {
  it("derives only supported metrics", () => {
    const result = buildDashboard({
      projects: [
        {
          id: 1,
          title: "A",
          coverImage: null,
          updatedAt: "2026-06-12T10:00:00Z",
        },
        {
          id: 2,
          title: "B",
          coverImage: { id: 9, url: "https://example.com/b.png" },
          updatedAt: "2026-06-11T10:00:00Z",
        },
      ],
      categories: [{ id: 1, name: "Full Stack" }],
      technologies: [{ id: 1, name: "TypeScript" }],
    });

    expect(result.metrics).toEqual({
      projects: 2,
      categories: 1,
      technologies: 1,
      withCover: 1,
      withoutCover: 1,
    });
    expect(result.recentProjects[0].title).toBe("A");
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
npm --prefix frontend test -- --run src/features/dashboard/server/build-dashboard.test.ts
```

Expected: FAIL because dashboard aggregation is missing.

- [ ] **Step 3: Implement aggregation and BFF route**

`buildDashboard` sorts by `updatedAt` descending, takes five recent projects,
and returns exactly the metrics in the test. It must not include publication,
analytics, roadmap, suggestion, or uptime data.

`GET /api/dashboard` requests `/projects`, `/category`, and `/technologies` in
parallel with the session token, normalizes names and image URLs, and returns
the aggregated result.

- [ ] **Step 4: Build loading, error, empty, and success states**

Create reusable `EmptyState` and `ErrorState` components with:

- Heading and description.
- Optional action.
- Visible keyboard focus.
- No decorative image dependency.

Dashboard skeleton mirrors five metric cards and the recent-project list.

- [ ] **Step 5: Build the dashboard UI**

Match the hierarchy in `Telas/Dashboard.png` while using real fields:

- Heading and welcome copy.
- Five metric cards.
- Quick actions for `New Project` and `View Projects`.
- Recent projects list with cover, title, category, and update date.
- Portfolio-completeness card showing only cover-image completeness.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
npm --prefix frontend run build
git add frontend/src/features/dashboard frontend/src/components/feedback frontend/src/app/api/dashboard frontend/src/app/'(dashboard)'/dashboard
git commit -m "feat(dashboard): add real portfolio overview"
```

## Task 11: Add Project BFF Contracts and Validation

**Files:**
- Create: `frontend/src/features/projects/types.ts`
- Create: `frontend/src/features/projects/schemas.ts`
- Create: `frontend/src/features/projects/schemas.test.ts`
- Create: `frontend/src/features/projects/server/normalize-project.ts`
- Create: `frontend/src/features/projects/server/normalize-project.test.ts`
- Create: `frontend/src/app/api/projects/route.ts`
- Create: `frontend/src/app/api/projects/[id]/route.ts`
- Create: `frontend/src/app/api/categories/route.ts`
- Create: `frontend/src/app/api/technologies/route.ts`
- Create: `frontend/src/app/api/images/route.ts`
- Create: `frontend/src/app/api/uploads/route.ts`
- Create: `frontend/src/features/projects/api/project-api.ts`
- Create: `frontend/src/features/projects/api/project-queries.ts`

- [ ] **Step 1: Write failing schema and normalizer tests**

Test:

```ts
expect(
  projectSchema.safeParse({
    title: "Portfolio Manager",
    description: "Open-source CMS",
    categoryId: 1,
    technologyIds: [2, 3],
    repositoryUrl: "https://github.com/example/repo",
    liveUrl: "https://portfolio.example.com",
    coverImageId: 9,
  }).success,
).toBe(true);
```

Reject invalid URLs and duplicate technology IDs.

Normalizer test input uses backend snake-case and expects:

```ts
{
  id: 1,
  title: "Portfolio Manager",
  description: "CMS",
  repositoryUrl: "https://github.com/example/repo",
  liveUrl: null,
  category: { id: 3, name: "Full Stack" },
  technologies: [{ id: 2, name: "TypeScript" }],
  coverImage: { id: 9, url: "http://localhost:3000/uploads/1/cover.png" },
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z"
}
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
npm --prefix frontend test -- --run src/features/projects/schemas.test.ts src/features/projects/server/normalize-project.test.ts
```

Expected: FAIL because types, schema, and normalizer are absent.

- [ ] **Step 3: Implement project types and schema**

Define `Project`, `ProjectInput`, `CategoryOption`, `TechnologyOption`, and
`ImageOption` in `types.ts`.

Create `projectSchema`:

```ts
export const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(5000),
  categoryId: z.number().int().positive(),
  technologyIds: z.array(z.number().int().positive()).max(30).refine(
    (ids) => new Set(ids).size === ids.length,
    "Choose each technology only once",
  ),
  repositoryUrl: z.union([z.url(), z.literal("")]).optional(),
  liveUrl: z.union([z.url(), z.literal("")]).optional(),
  coverImageId: z.number().int().positive().nullable(),
});
```

- [ ] **Step 4: Implement normalization and payload mapping**

`normalizeProject` maps the exact backend fields to the camel-case frontend
contract. `toBackendProjectInput` maps:

```ts
{
  title: input.title,
  description: input.description,
  d_categoryId: input.categoryId,
  technologyIds: input.technologyIds,
  repo_url: input.repositoryUrl || undefined,
  live_url: input.liveUrl || undefined,
  f_imagesId: input.coverImageId ?? undefined,
}
```

- [ ] **Step 5: Implement project and lookup Route Handlers**

- `GET /api/projects`: forward and normalize the array.
- `POST /api/projects`: validate with `projectSchema`, map payload, forward,
  normalize result.
- `GET/PATCH/DELETE /api/projects/[id]`: validate positive integer ID and
  normalize successful project responses.
- Categories map `{ id, category }` to `{ id, name }`.
- Technologies map `{ id, tech }` to `{ id, name }`.
- Images forward already-presented image objects.
- Upload accepts multipart `file`, checks type and 5 MB before forwarding to
  `/upload/users/:userId`. Resolve the current user ID through `/auth/me`
  server-side; never accept a user ID from the browser.

- [ ] **Step 6: Implement client API and TanStack Query keys**

Use one `requestJson<T>` helper that throws `ApiError` for non-2xx responses.
Define stable query keys:

```ts
export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: number) => ["projects", id] as const,
  categories: ["categories"] as const,
  technologies: ["technologies"] as const,
  images: ["images"] as const,
};
```

Mutations invalidate `projectKeys.all`, the affected detail key, images after
upload, and `["dashboard"]`.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
git add frontend/src/features/projects frontend/src/app/api/projects frontend/src/app/api/categories frontend/src/app/api/technologies frontend/src/app/api/images frontend/src/app/api/uploads
git commit -m "feat(projects): add typed BFF contracts"
```

## Task 12: Build the Projects List

**Files:**
- Create: `frontend/src/features/projects/components/project-filters.tsx`
- Create: `frontend/src/features/projects/components/project-summary.tsx`
- Create: `frontend/src/features/projects/components/project-table.tsx`
- Create: `frontend/src/features/projects/components/project-mobile-list.tsx`
- Create: `frontend/src/features/projects/components/delete-project-dialog.tsx`
- Create: `frontend/src/features/projects/components/projects-view.tsx`
- Create: `frontend/src/features/projects/components/projects-view.test.tsx`
- Create: `frontend/src/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Write the failing filtering test**

Render `ProjectsView` with two projects and assert:

```ts
await user.type(screen.getByRole("searchbox"), "portfolio");
expect(screen.getByText("Portfolio Manager")).toBeInTheDocument();
expect(screen.queryByText("Chat API")).not.toBeInTheDocument();
```

Select a category and technology, verify intersection filtering, and verify
query parameters update through mocked `useRouter.replace`.

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
npm --prefix frontend test -- --run src/features/projects/components/projects-view.test.tsx
```

Expected: FAIL because the view is absent.

- [ ] **Step 3: Implement filters backed by URL search parameters**

Support:

```text
?q=portfolio&category=3&technology=2
```

Use case-insensitive title/description matching. Category and technology
filters are exact numeric IDs. Invalid query values are ignored.

- [ ] **Step 4: Build summary cards and responsive records**

Summary cards:

- Total projects.
- With cover.
- Without cover.
- Categories represented.

Desktop uses a semantic table. Under `md`, render cards containing the same
information and actions. Both include cover, title, truncated description,
category, technology badges, update date, edit, and delete.

- [ ] **Step 5: Implement deletion with confirmation**

The dialog names the project and requires an explicit `Delete project`
button. On success:

- Close the dialog.
- Invalidate projects and dashboard.
- Show a success toast.

On failure, keep the dialog open and show the normalized error.

- [ ] **Step 6: Implement route states**

The page must show:

- Skeleton table during first load.
- Retryable error state.
- Empty portfolio state with `Create your first project`.
- No-results state that clears filters.
- `New Project` primary action.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
npm --prefix frontend run build
git add frontend/src/features/projects/components frontend/src/app/'(dashboard)'/projects/page.tsx
git commit -m "feat(projects): add searchable project management list"
```

## Task 13: Build the Project Editor and Media Picker

**Files:**
- Create: `frontend/src/features/projects/components/technology-multi-select.tsx`
- Create: `frontend/src/features/projects/components/media-picker.tsx`
- Create: `frontend/src/features/projects/components/project-form.tsx`
- Create: `frontend/src/features/projects/components/project-form.test.tsx`
- Create: `frontend/src/features/projects/components/project-editor.tsx`
- Create: `frontend/src/app/(dashboard)/projects/new/page.tsx`
- Create: `frontend/src/app/(dashboard)/projects/[id]/edit/page.tsx`

- [ ] **Step 1: Write failing form and upload tests**

Test that:

- Empty title and description block submission.
- Selecting technologies returns unique numeric IDs.
- A 6 MB file is rejected before `fetch`.
- A PNG under 5 MB uploads and becomes the selected cover.
- An API failure keeps title, description, and selected relationships.

Use a real `File` object:

```ts
const oversized = new File(
  [new Uint8Array(6 * 1024 * 1024)],
  "large.png",
  { type: "image/png" },
);
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
npm --prefix frontend test -- --run src/features/projects/components/project-form.test.tsx
```

Expected: FAIL because editor components are missing.

- [ ] **Step 3: Implement the technology multi-select**

Use shadcn `Popover` and `Command`. Requirements:

- Search technologies by name.
- Toggle without duplicates.
- Show selected items as removable badges.
- Keyboard-operable.
- Set `aria-expanded`, label, and clear button.

- [ ] **Step 4: Implement the media picker and upload**

Media picker:

- Grid of the current user's images.
- Selected border and check indicator.
- `Upload image` input accepting `.jpg,.jpeg,.png,.gif`.
- Client validation for MIME type and 5 MB.
- Upload progress text.
- Refresh images and select the new image after success.
- Image alt text uses description or `Portfolio media`.

- [ ] **Step 5: Implement the shared project form**

Use React Hook Form with `zodResolver(projectSchema)`.

Desktop layout:

```text
Main 70%: title, description, category, technologies, URLs
Side 30%: cover image and save/cancel actions
```

Mobile layout stacks all sections. Submit labels:

- Create: `Create Project`.
- Edit: `Save Changes`.

Focus the first invalid field. Disable submit during mutation. Preserve form
state after server failures.

- [ ] **Step 6: Implement create and edit routes**

`/projects/new` loads categories, technologies, and images, then creates.

`/projects/[id]/edit` additionally loads the project detail and maps it to
form defaults:

```ts
{
  title: project.title,
  description: project.description,
  categoryId: project.category.id,
  technologyIds: project.technologies.map((technology) => technology.id),
  repositoryUrl: project.repositoryUrl ?? "",
  liveUrl: project.liveUrl ?? "",
  coverImageId: project.coverImage?.id ?? null,
}
```

On success, redirect to `/projects` and show a toast through a one-time query
parameter `?created=1` or `?updated=1`, which the list removes after display.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
npm --prefix frontend run test:run
npm --prefix frontend run lint
npm --prefix frontend run build
git add frontend/src/features/projects frontend/src/app/'(dashboard)'/projects
git commit -m "feat(projects): add project editor and cover uploads"
```

## Task 14: Add End-to-End Fixtures and Playwright Coverage

**Files:**
- Create: `backend/prisma/e2e-seed.ts`
- Modify: `backend/package.json`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/global-setup.ts`
- Create: `frontend/e2e/auth.spec.ts`
- Create: `frontend/e2e/projects.spec.ts`

- [ ] **Step 1: Create idempotent E2E data**

Create `backend/prisma/e2e-seed.ts` that:

- Upserts roles, statuses, and auth methods.
- Upserts `Full Stack` and `Backend` categories.
- Upserts `TypeScript`, `NestJS`, and `PostgreSQL` technologies.
- Upserts verified user `e2e@portfolio.test` with password `E2eStrongP@ss1`.
- Upserts pending user `verify@portfolio.test`.
- Replaces that pending user's active verification token with:
  - token: `e2e-verification-token`
  - code: `123456`
  - expiry: one hour from seed execution
- Deletes projects owned by the verified E2E user.

Use this implementation:

```ts
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const [pending, active, regular, emailMethod] = await Promise.all([
    prisma.d_status.upsert({
      where: { status: "pendente" },
      update: {},
      create: { id: 1, status: "pendente" },
    }),
    prisma.d_status.upsert({
      where: { status: "ativo" },
      update: {},
      create: { id: 2, status: "ativo" },
    }),
    prisma.d_roles.upsert({
      where: { role: "regular_user" },
      update: {},
      create: { id: 2, role: "regular_user" },
    }),
    prisma.d_auth_method.upsert({
      where: { method: "email" },
      update: {},
      create: { id: 1, method: "email" },
    }),
  ]);

  await Promise.all(
    ["Full Stack", "Backend"].map((category) =>
      prisma.d_category.upsert({
        where: { category },
        update: {},
        create: { category },
      }),
    ),
  );
  await Promise.all(
    ["TypeScript", "NestJS", "PostgreSQL"].map((tech) =>
      prisma.d_technologies.upsert({
        where: { tech },
        update: {},
        create: { tech },
      }),
    ),
  );

  const password_hash = await bcrypt.hash("E2eStrongP@ss1", 12);
  const verified = await prisma.f_user.upsert({
    where: { email: "e2e@portfolio.test" },
    update: {
      password_hash,
      status_id: active.id,
      verified_email: true,
      email_verified_at: new Date(),
    },
    create: {
      username: "e2e_user",
      email: "e2e@portfolio.test",
      password_hash,
      role_id: regular.id,
      status_id: active.id,
      auth_method_id: emailMethod.id,
      verified_email: true,
      email_verified_at: new Date(),
    },
  });

  const verificationUser = await prisma.f_user.upsert({
    where: { email: "verify@portfolio.test" },
    update: {
      password_hash,
      status_id: pending.id,
      verified_email: false,
      email_verified_at: null,
    },
    create: {
      username: "verify_user",
      email: "verify@portfolio.test",
      password_hash,
      role_id: regular.id,
      status_id: pending.id,
      auth_method_id: emailMethod.id,
      verified_email: false,
    },
  });

  await prisma.f_projects.deleteMany({ where: { f_userId: verified.id } });
  await prisma.f_email_verification_token.deleteMany({
    where: { user_id: verificationUser.id },
  });
  await prisma.f_email_verification_token.create({
    data: {
      token: "e2e-verification-token",
      code: "123456",
      user_id: verificationUser.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Add backend scripts:

```json
{
  "scripts": {
    "start:e2e": "cross-env NODE_ENV=test EMAIL_TRANSPORT=json FRONTEND_URL=http://localhost:3001 BACKEND_PUBLIC_URL=http://localhost:3000 dotenv -e .env.development -- nest start",
    "prisma:e2e:migrate": "dotenv -e .env.development -- prisma migrate deploy",
    "prisma:e2e:seed": "dotenv -e .env.development -- ts-node prisma/e2e-seed.ts"
  }
}
```

- [ ] **Step 2: Configure Playwright**

Create `frontend/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm --prefix ../backend run start:e2e",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      url: "http://127.0.0.1:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
```

`global-setup.ts` executes:

```ts
execFileSync("npm", ["--prefix", "../backend", "run", "prisma:e2e:seed"], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: process.platform === "win32",
});
```

- [ ] **Step 3: Write authentication browser tests**

Cover:

1. Unauthenticated `/dashboard` redirects to `/login`.
2. Local login reaches the dashboard.
3. Logout returns to login and protected routes redirect again.
4. Registration reaches verification with the email displayed.
5. Navigate to
   `/api/auth/verification-link?token=e2e-verification-token&email=verify%40portfolio.test`,
   enter `123456`, and reach verified-success login.
6. Google callback test posts a controlled matching state without contacting
   Google; assert token is not visible in the URL or local storage.

Implement the local login/logout and verification cases with:

```ts
import { expect, test } from "@playwright/test";

test("local login and logout protect the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email address").fill("e2e@portfolio.test");
  await page.getByLabel("Password").fill("E2eStrongP@ss1");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("button", { name: /user menu/i }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("verifies an email challenge from its link", async ({ page }) => {
  await page.goto(
    "/api/auth/verification-link?token=e2e-verification-token&email=verify%40portfolio.test",
  );
  await page.getByLabel("Verification code").fill("123456");
  await page.getByRole("button", { name: "Verify Email" }).click();
  await expect(page).toHaveURL(/\/login\?verified=1/);
});
```

For the Google handoff test, obtain a real E2E JWT directly from NestJS,
set `pm_oauth_state` with `context.addCookies`, then use `page.setContent` with
a self-submitting form posting the token and state to
`/api/auth/google/callback`. Assert `/dashboard`, empty local/session storage,
and no token in `page.url()`.

- [ ] **Step 4: Write project CRUD browser tests**

Log in as `e2e@portfolio.test`, then:

1. Create a project with category and two technologies.
2. Verify it appears in the list.
3. Search by title.
4. Edit description and remove one technology.
5. Upload a small PNG fixture and select it as cover.
6. Verify dashboard project and cover metrics.
7. Delete the project and verify the empty state.

Generate the PNG fixture in the test with a base64 1x1 PNG so no binary fixture
needs manual maintenance.

The main CRUD test follows this exact interaction order:

```ts
test("creates, edits, filters, and deletes a project", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("e2e@portfolio.test");
  await page.getByLabel("Password").fill("E2eStrongP@ss1");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.goto("/projects/new");
  await page.getByLabel("Title").fill("Portfolio Manager E2E");
  await page.getByLabel("Description").fill("Project created by Playwright");
  await page.getByLabel("Category").click();
  await page.getByRole("option", { name: "Full Stack" }).click();
  await page.getByLabel("Technologies").click();
  await page.getByRole("option", { name: "TypeScript" }).click();
  await page.getByRole("option", { name: "NestJS" }).click();
  await page.getByRole("button", { name: "Create Project" }).click();

  await expect(page).toHaveURL(/\/projects/);
  await expect(page.getByText("Portfolio Manager E2E")).toBeVisible();
  await page.getByRole("searchbox").fill("Portfolio Manager E2E");
  await expect(page.getByText("Portfolio Manager E2E")).toBeVisible();

  await page.getByRole("link", { name: "Edit Portfolio Manager E2E" }).click();
  await page
    .getByLabel("Description")
    .fill("Project updated by Playwright");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Project updated by Playwright")).toBeVisible();

  await page
    .getByRole("button", { name: "Delete Portfolio Manager E2E" })
    .click();
  await page.getByRole("button", { name: "Delete project" }).click();
  await expect(page.getByText("Portfolio Manager E2E")).not.toBeVisible();
});
```

Add a second project-editor test that uploads the generated 1x1 PNG, selects
it, saves, and verifies the dashboard `With cover` metric increments.

- [ ] **Step 5: Run E2E tests**

Start PostgreSQL:

```powershell
docker compose up -d db
```

Apply migrations and run Playwright:

```powershell
npm --prefix backend run prisma:e2e:migrate
npm --prefix frontend run test:e2e -- --project=chromium
npm --prefix frontend run test:e2e -- --project=mobile
```

Expected: both projects pass.

- [ ] **Step 6: Commit E2E coverage**

Run:

```powershell
git add backend/prisma/e2e-seed.ts backend/package.json backend/package-lock.json frontend/e2e frontend/playwright.config.ts
git commit -m "test: cover authentication and project workflows"
```

## Task 15: Containerize, Document, and Perform Final Verification

**Files:**
- Create: `frontend/Dockerfile`
- Modify: `frontend/next.config.ts`
- Modify: `docker-compose.yml`
- Modify: `readme.md`
- Modify: `DOCUMENTATION.md`
- Modify: `backend/test/jest-e2e.json`
- Modify: `backend/test/app.e2e-spec.ts`

- [ ] **Step 1: Fix the NestJS E2E alias configuration**

Set `backend/test/jest-e2e.json` to:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/../src/$1"
  }
}
```

Replace the old Hello World-only E2E test with:

- `GET /` returns `200`.
- Unauthenticated `GET /projects` returns `401`.
- Unauthenticated `DELETE /projects/1` returns `401`.
- `GET /api-docs` returns `200`.

- [ ] **Step 2: Add production Next.js container output**

Set `frontend/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

Create `frontend/Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run brand:generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3001
CMD ["node", "server.js"]
```

- [ ] **Step 3: Add the frontend service to Docker Compose**

Update `docker-compose.yml` with:

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      BACKEND_URL: http://backend:3000
      NEXT_PUBLIC_APP_URL: http://localhost:3001
      SESSION_COOKIE_NAME: pm_session
      VERIFICATION_COOKIE_NAME: pm_verification
      OAUTH_STATE_COOKIE_NAME: pm_oauth_state
    depends_on:
      - backend
```

Add to the backend service:

```yaml
    environment:
      FRONTEND_URL: http://localhost:3001
      CORS_ORIGINS: http://localhost:3001
      BACKEND_PUBLIC_URL: http://localhost:3000
```

- [ ] **Step 4: Update documentation**

In `readme.md`:

- Mark frontend foundation, authentication, dashboard, and project CRUD as
  implemented.
- Add frontend local URL `http://localhost:3001`.
- Add frontend setup commands.
- Explain that future sidebar entries are intentionally disabled.

In `DOCUMENTATION.md`:

- Document the Next.js BFF boundary.
- Document the `HttpOnly` session cookie.
- Document verification challenge handling.
- Document Google POST handoff and state validation.
- Document current project request/response fields.
- Document 5 MB JPEG/PNG/GIF upload limits.

- [ ] **Step 5: Run the complete verification suite**

Run:

```powershell
docker compose up -d db
npm --prefix backend run prisma:e2e:migrate
npm --prefix backend run build
npm --prefix backend test -- --runInBand
npm --prefix backend run test:e2e
npm --prefix frontend run lint
npm --prefix frontend run test:run
npm --prefix frontend run build
docker compose config
git diff --check
git status --short
```

Expected:

- Backend build and tests pass.
- Frontend lint, tests, and build pass.
- Docker Compose configuration is valid.
- No whitespace errors.
- Only intentional files remain modified.

- [ ] **Step 6: Perform final visual and security checks**

At desktop 1440x1024, tablet 768x1024, and mobile 390x844:

- Login matches the supplied visual direction.
- Sidebar/header spacing and active states are consistent.
- Dashboard contains no fabricated metrics.
- Projects list and editor remain usable without horizontal page overflow.
- Focus indicators are visible.
- Disabled `Soon` navigation cannot navigate.
- Token values are absent from local storage, session storage, visible URLs,
  and all persistent application pages after the transient OAuth handoff.
- Another user cannot list, edit, delete, or use the first user's project
  covers.

- [ ] **Step 7: Commit the final integration**

Run:

```powershell
git add frontend/Dockerfile frontend/next.config.ts docker-compose.yml readme.md DOCUMENTATION.md backend/test
git commit -m "docs: finalize frontend foundation delivery"
```

## Final Acceptance Checklist

- [ ] `frontend/` runs on port 3001 and uses Next.js App Router.
- [ ] JWT is stored only in an `HttpOnly` cookie.
- [ ] Registration, verification, resend, Google OAuth, login, and logout work.
- [ ] Project and image access is isolated by authenticated user.
- [ ] Project CRUD supports category, technologies, cover, repository, and demo.
- [ ] Dashboard uses only real supported data.
- [ ] Logo SVG, 2048px PNG, app icons, and favicon are generated and used.
- [ ] Desktop, tablet, and mobile layouts are usable and accessible.
- [ ] Unit, integration, E2E, build, lint, and Docker checks pass.
- [ ] Future modules are clearly disabled and do not simulate functionality.
