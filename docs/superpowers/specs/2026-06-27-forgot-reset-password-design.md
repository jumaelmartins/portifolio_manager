# Forgot / Reset Password Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow unauthenticated users to recover access to their account by requesting a password-reset link via email and then setting a new password through that link.

**Architecture:** A new `f_password_reset_token` table stores short-lived reset tokens (30 min). The backend exposes two public endpoints (`POST /auth/forgot-password` and `POST /auth/reset-password`). The frontend adds two pages (`/forgot-password`, `/reset-password`) and two BFF proxy routes. The reset link is sent by email as a direct URL containing the token as a query parameter.

**Tech Stack:** NestJS + Prisma + PostgreSQL (backend); Next.js 16 App Router + TanStack Query + Zod (frontend); Nodemailer via existing `EmailService`.

---

## Global Constraints

- Token expiry: 30 minutes from issuance.
- Rate limiting: max 3 reset requests per email per hour; 2-minute cooldown between requests (same pattern as `EmailVerificationService`).
- Google OAuth accounts (`auth_method_id !== 1`): reject `POST /auth/forgot-password` with `400 { message: "Esta conta usa login via Google. Acesse pelo botão 'Entrar com Google'." }`.
- Non-existent emails: always respond `200` with the generic message — never reveal whether the email is registered.
- Password rules for reset: same Zod rules as registration (`min 8, uppercase, number, special char`).
- All new backend code follows the existing module pattern: service → repository interface → Prisma implementation → in-memory for tests.
- New frontend pages live in `src/app/(auth)/` (unauthenticated route group).
- BFF routes live in `src/app/api/auth/`.

---

## Section 1 — Database

### New table: `f_password_reset_token`

Prisma model added to `backend/prisma/schema.prisma`:

```prisma
model f_password_reset_token {
  id         String    @id @default(uuid())
  token      String    @unique
  user_id    Int
  expires_at DateTime
  is_used    Boolean   @default(false)
  used_at    DateTime?
  created_at DateTime  @default(now())

  f_user f_user @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, created_at], map: "password_reset_tokens_user_id_created_at_idx")
  @@map("password_reset_tokens")
}
```

`f_user` gains a `f_password_reset_token f_password_reset_token[]` relation.

A new Prisma migration is required after the schema change. Regenerate the client with `npm run prisma:dev:generate`.

---

## Section 2 — Backend

### `PasswordResetService` (`src/modules/auth/password_reset.service.ts`)

Injected dependencies: `PrismaService`, `EmailService`, `ConfigService`, `HashService`.

**`requestPasswordReset(email: string): Promise<void>`**

1. Find user by email via `prisma.f_user.findUnique({ where: { email } })`.
2. If user not found → return silently (no error, no email).
3. If `user.auth_method_id !== 1` → throw `BadRequestException("Esta conta usa login via Google. Acesse pelo botão 'Entrar com Google'.")`.
4. Enforce rate limits (see below).
5. Invalidate existing unused tokens: `updateMany({ where: { user_id, is_used: false }, data: { is_used: true, used_at: now } })`.
6. Generate `token = randomBytes(32).toString('hex')`.
7. Set `expires_at = now + 30 minutes`.
8. Insert new `f_password_reset_token`.
9. Build `resetUrl = ${FRONTEND_URL}/reset-password?token=${token}`.
10. Call `emailService.sendPasswordResetEmail(email, userName, resetUrl, 1800)`.

**Rate limiting** (inside a `$transaction` with `pg_advisory_xact_lock` on `user_id`, same pattern as `EmailVerificationService`):
- Count tokens created in the last 60 minutes. If ≥ 3 → throw `429` with `retryAfterSeconds`.
- Check most recent token: if created less than 2 minutes ago → throw `429` with `retryAfterSeconds`.

**`resetPassword(token: string, password: string): Promise<void>`**

Inside a `$transaction`:
1. Find token record with `f_user` include.
2. If not found → throw `BadRequestException("Link inválido ou expirado.")`.
3. If `is_used` → throw `BadRequestException("Este link já foi utilizado.")`.
4. If `expires_at < now` → throw `BadRequestException("Link expirado. Solicite um novo.")`.
5. Mark token as used: `update({ data: { is_used: true, used_at: now } })`.
6. Hash new password with `HashService.hashPassword(password)`.
7. Update `f_user.password_hash`.

### `AuthController` additions (`src/modules/auth/auth.controller.ts`)

```typescript
@Post('forgot-password')
@HttpCode(HttpStatus.OK)
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  await this.passwordResetService.requestPasswordReset(dto.email);
  return { message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.' };
}

@Post('reset-password')
@HttpCode(HttpStatus.OK)
async resetPassword(@Body() dto: ResetPasswordDto) {
  await this.passwordResetService.resetPassword(dto.token, dto.password);
  return { message: 'Senha redefinida com sucesso!' };
}
```

### DTOs (`src/modules/auth/dto/`)

**`ForgotPasswordDto`** (`forgot-password.dto.ts`):
```typescript
import { IsEmail } from 'class-validator';
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

**`ResetPasswordDto`** (`reset-password.dto.ts`):
```typescript
import { IsString, MinLength, Matches } from 'class-validator';
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/\d/, { message: 'password must contain a number' })
  @Matches(/[@$!%*?&]/, { message: 'password must contain a special character' })
  password: string;
}
```

### `EmailService` addition (`src/email/email.service.ts`)

New public method:
```typescript
async sendPasswordResetEmail(
  email: string,
  userName: string,
  resetUrl: string,
  expiresInSeconds: number,
): Promise<boolean>
```

Sends an HTML email with:
- A prominent button/link pointing to `resetUrl`.
- Expiry notice: `expiresInSeconds / 60` minutes.
- Warning: "Se você não solicitou esta redefinição, ignore este email."

### `AuthModule` update (`src/modules/auth/auth.module.ts`)

Register `PasswordResetService` as a provider. Import `HashService` if not already imported (it lives in `CommonModule` — check if `CommonModule` is already in `AuthModule` imports; if not, add it).

### In-memory repository for tests

`PasswordResetService` uses `PrismaService` directly (no repository interface needed — same pattern as `EmailVerificationService` which also uses `PrismaService` directly).

### Unit tests (`src/modules/auth/password_reset.service.spec.ts`)

Use `Test.createTestingModule()` with mocked `PrismaService`, `EmailService`, `ConfigService`, `HashService`. Cover:
- `requestPasswordReset`: unknown email (silent), Google OAuth account (400), rate limit exceeded (429), success (token created + email sent).
- `resetPassword`: invalid token (400), already used (400), expired (400), success (password updated).

---

## Section 3 — Frontend

### Zod schemas (`src/features/auth/schemas.ts`)

Add to the existing file:

```typescript
export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
```

### Feature components (`src/features/auth/components/`)

**`forgot-password-form.tsx`**
- React Hook Form + `forgotPasswordSchema`.
- On submit: `POST /api/auth/forgot-password` via existing `bff.ts` fetch helper.
- On success: replace form with a success state message ("Verifique sua caixa de entrada.").
- On `400` (Google account): show inline error with the server message.
- On other errors: generic error message.

**`reset-password-form.tsx`**
- Reads `token` from `useSearchParams()`.
- If no token in URL: render error state with link to `/forgot-password`.
- React Hook Form + `resetPasswordSchema`.
- On submit: `POST /api/auth/reset-password` with `{ token, password }`.
- On success: `router.push('/login?reset=success')`.
- On `400` (invalid/expired token): show error + link to `/forgot-password`.

### Pages (`src/app/(auth)/`)

**`forgot-password/page.tsx`** — renders `<AuthShell>` + `<ForgotPasswordForm />`.

**`reset-password/page.tsx`** — renders `<AuthShell>` + `<ResetPasswordForm />`. Wraps in `<Suspense>` because it calls `useSearchParams()`.

### BFF Routes (`src/app/api/auth/`)

**`forgot-password/route.ts`**:
```typescript
export async function POST(request: Request) {
  return bffFetch('/auth/forgot-password', {
    method: 'POST',
    body: await request.text(),
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**`reset-password/route.ts`** — same pattern, proxies to `/auth/reset-password`.

### Login page addition (`src/app/(auth)/login/page.tsx` or `login-form.tsx`)

Add a "Esqueceu a senha?" link below the password field, pointing to `/forgot-password`.

### Login page success toast

If `searchParams.get('reset') === 'success'`, show a success banner: "Senha redefinida com sucesso! Faça login com sua nova senha."

---

## Section 4 — Testing

### Backend unit tests

File: `backend/src/modules/auth/password_reset.service.spec.ts`

Scenarios:
1. Unknown email → returns without error, no email sent.
2. Google OAuth user → throws `BadRequestException`.
3. Rate limit (≥3 in last hour) → throws `429`.
4. Cooldown (< 2 min since last request) → throws `429`.
5. Happy path `requestPasswordReset` → token created, email sent, previous unused tokens invalidated.
6. `resetPassword` with unknown token → `400`.
7. `resetPassword` with used token → `400`.
8. `resetPassword` with expired token → `400`.
9. `resetPassword` happy path → password updated, token marked used.

### Frontend unit tests

File: `frontend/src/features/auth/components/auth-forms.test.tsx` (extend existing file)

Scenarios:
- `ForgotPasswordForm`: renders email field; submits correctly; shows success state; shows Google-account error.
- `ResetPasswordForm`: shows error when no token in URL; validates password rules; submits correctly; redirects on success; shows invalid-token error.

### E2E (manual smoke test — not automated)

1. Request reset for non-existent email → success message shown.
2. Request reset for Google account → error message shown.
3. Request reset for valid account → email received, link works, password updated, login with new password succeeds.
4. Attempt to reuse the same reset link → "link já foi utilizado" error.
5. Attempt to use expired link → "link expirado" error.
