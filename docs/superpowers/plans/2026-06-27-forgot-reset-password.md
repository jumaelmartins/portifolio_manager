# Forgot / Reset Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow unauthenticated users to request a password-reset link via email and set a new password through that link.

**Architecture:** A new `f_password_reset_token` Prisma model stores short-lived reset tokens (30 min). The backend exposes two public endpoints (`POST /auth/forgot-password`, `POST /auth/reset-password`) served by a new `PasswordResetService`. The frontend adds two pages (`/forgot-password`, `/reset-password`) plus BFF proxy routes; the reset link is delivered in the email as a direct URL with the token as a query parameter.

**Tech Stack:** NestJS + Prisma + PostgreSQL; Next.js 16 App Router; React Hook Form + Zod; Nodemailer via existing `EmailService`; Vitest + Testing Library.

## Global Constraints

- Token expiry: 30 minutes from issuance.
- Rate limiting: max 3 reset requests per email per hour; 2-minute cooldown between requests.
- Google OAuth accounts (`auth_method_id !== 1`): `POST /auth/forgot-password` throws `400` with message `"Esta conta usa login via Google. Acesse pelo botão 'Entrar com Google'."`.
- Non-existent emails: always respond `200` with generic message — never reveal whether the email is registered.
- Password rules for reset: same Zod regex rules as registration (`min 8`, uppercase, number, special char `[@$!%*?&]`).
- New backend code follows the existing module pattern: service uses `PrismaService` directly (no repository interface — same as `EmailVerificationService`).
- New frontend pages live in `frontend/src/app/(auth)/` (unauthenticated route group).
- BFF routes live in `frontend/src/app/api/auth/`.
- All commands below are run from the stated directory (either `backend/` or `frontend/`).

---

## File Map

### Backend — new files
- `backend/src/modules/auth/dto/forgot-password.dto.ts`
- `backend/src/modules/auth/dto/reset-password.dto.ts`
- `backend/src/modules/auth/password_reset.service.ts`
- `backend/src/modules/auth/password_reset.service.spec.ts`

### Backend — modified files
- `backend/prisma/schema.prisma` — add `f_password_reset_token` model + relation on `f_user`
- `backend/src/email/email.service.ts` — add `sendPasswordResetEmail` method
- `backend/src/email/email.service.spec.ts` — add test for new method
- `backend/src/modules/auth/auth.controller.ts` — add two endpoints, inject `PasswordResetService`
- `backend/src/modules/auth/auth.controller.spec.ts` — add `passwordResetService` mock + two tests
- `backend/src/modules/auth/auth.module.ts` — register `PasswordResetService`

### Frontend — new files
- `frontend/src/app/api/auth/forgot-password/route.ts`
- `frontend/src/app/api/auth/reset-password/route.ts`
- `frontend/src/features/auth/components/forgot-password-form.tsx`
- `frontend/src/features/auth/components/reset-password-form.tsx`
- `frontend/src/app/(auth)/forgot-password/page.tsx`
- `frontend/src/app/(auth)/reset-password/page.tsx`

### Frontend — modified files
- `frontend/src/features/auth/schemas.ts` — add `forgotPasswordSchema`, `resetPasswordSchema`
- `frontend/src/features/auth/components/auth-forms.test.tsx` — add tests for new forms + login banner
- `frontend/src/features/auth/components/login-form.tsx` — add "Forgot password?" link + reset-success banner
- `frontend/src/app/(auth)/login/page.tsx` — pass `resetSuccess` prop from `?reset=success` param

---

### Task 1: Database — `f_password_reset_token` schema + migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma client gains `prisma.f_password_reset_token.*` — all tasks from Task 3 onward depend on this.

- [ ] **Step 1: Add the Prisma model**

Open `backend/prisma/schema.prisma`. Add this model at the bottom (after `custom_section_item`):

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

Also add the relation field to the `f_user` model, right after the `f_email_verification_token` line:

```prisma
  f_password_reset_token f_password_reset_token[]
```

- [ ] **Step 2: Run migration**

From `backend/`:
```bash
npm run prisma:dev:migrate
```

When prompted for a migration name, enter: `add_password_reset_tokens`

Expected: migration file created and applied, output ends with `The following migration(s) have been applied`.

- [ ] **Step 3: Regenerate Prisma client**

From `backend/`:
```bash
npm run prisma:dev:generate
```

Expected: output contains `Generated Prisma Client`.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add password_reset_tokens table"
```

---

### Task 2: `EmailService.sendPasswordResetEmail` + test

**Files:**
- Modify: `backend/src/email/email.service.ts`
- Modify: `backend/src/email/email.service.spec.ts`

**Interfaces:**
- Produces: `EmailService.sendPasswordResetEmail(email: string, userName: string, resetUrl: string, expiresInSeconds: number): Promise<boolean>` — called by `PasswordResetService` in Task 3.

- [ ] **Step 1: Write the failing test**

Open `backend/src/email/email.service.spec.ts`. Add a new `it` block inside the existing `describe('EmailService configuration', ...)`:

```typescript
it('sends a password reset email containing the reset URL', async () => {
  const values: Record<string, unknown> = {
    EMAIL_TRANSPORT: 'json',
    EMAIL_FROM: 'Portfolio Manager <noreply@example.com>',
    FRONTEND_URL: 'http://localhost:3001',
  };
  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => values[key] ?? defaultValue),
  };
  const service = new EmailService(configService as never);

  const result = await service.sendPasswordResetEmail(
    'owner@example.com',
    'owner',
    'http://localhost:3001/reset-password?token=abc123def456',
    1800,
  );

  expect(result).toBe(true);
  expect(sentMailOptions).toBeDefined();
  expect(sentMailOptions!.from).toBe('Portfolio Manager <noreply@example.com>');
  expect(sentMailOptions!.html).toEqual(
    expect.stringContaining('http://localhost:3001/reset-password?token=abc123def456'),
  );
  expect(sentMailOptions!.html).toEqual(expect.stringContaining('30 minutos'));
});
```

- [ ] **Step 2: Run test to verify it fails**

From `backend/`:
```bash
npm test -- --testPathPattern=email.service.spec
```

Expected: FAIL — `service.sendPasswordResetEmail is not a function`.

- [ ] **Step 3: Add `sendPasswordResetEmail` and its HTML template to `EmailService`**

Open `backend/src/email/email.service.ts`. Add after `sendWelcomeEmail`:

```typescript
async sendPasswordResetEmail(
  email: string,
  userName: string,
  resetUrl: string,
  expiresInSeconds: number,
): Promise<boolean> {
  try {
    const expirationMinutes = Math.ceil(expiresInSeconds / 60);
    const mailOptions = {
      from: this.configService.get<string>(
        'EMAIL_FROM',
        'Portfolio Manager <noreply@example.com>',
      ),
      to: email,
      subject: '🔑 Redefinição de senha - Portfolio Manager',
      html: this.getPasswordResetEmailTemplate(userName, resetUrl, expirationMinutes),
    };
    const result = (await this.transporter.sendMail(mailOptions)) as {
      messageId?: string;
    };
    this.logger.log(`Email de redefinição de senha enviado para: ${email}`);
    this.logger.debug(`Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    this.logger.error(`Erro ao enviar email de redefinição para ${email}:`, error);
    return false;
  }
}

private getPasswordResetEmailTemplate(
  userName: string,
  resetUrl: string,
  expirationMinutes: number,
): string {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinição de Senha</title>
      <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 14px 36px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 16px; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; color: #856404; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>🔑 Redefinição de Senha</h1>
              <p>Olá, ${userName}!</p>
          </div>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir minha senha</a>
          </div>
          <p>Ou acesse diretamente: <br><code>${resetUrl}</code></p>
          <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                  <li>Este link expira em <strong>${expirationMinutes} minutos</strong></li>
                  <li>O link pode ser usado apenas uma vez</li>
                  <li>Se você não solicitou esta redefinição, ignore este email</li>
              </ul>
          </div>
          <div class="footer">
              <p>Este é um email automático, não responda a esta mensagem.</p>
          </div>
      </div>
  </body>
  </html>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

From `backend/`:
```bash
npm test -- --testPathPattern=email.service.spec
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/email/email.service.ts backend/src/email/email.service.spec.ts
git commit -m "feat(email): add sendPasswordResetEmail method"
```

---

### Task 3: `PasswordResetService` — DTOs + service + `AuthModule` registration

**Files:**
- Create: `backend/src/modules/auth/dto/forgot-password.dto.ts`
- Create: `backend/src/modules/auth/dto/reset-password.dto.ts`
- Create: `backend/src/modules/auth/password_reset.service.ts`
- Create: `backend/src/modules/auth/password_reset.service.spec.ts`
- Modify: `backend/src/modules/auth/auth.module.ts`

**Interfaces:**
- Consumes: `EmailService.sendPasswordResetEmail` (Task 2); `prisma.f_password_reset_token.*` (Task 1); `HashService.hashPassword(plain: string): Promise<string>` (already in `AuthModule`).
- Produces: `PasswordResetService.requestPasswordReset(email: string): Promise<void>`; `PasswordResetService.resetPassword(token: string, password: string): Promise<void>` — called by `AuthController` in Task 4.

- [ ] **Step 1: Write the failing tests**

Create `backend/src/modules/auth/password_reset.service.spec.ts`:

```typescript
import { BadRequestException, HttpException } from '@nestjs/common';
import { PasswordResetService } from './password_reset.service';

describe('PasswordResetService', () => {
  let prisma: {
    $transaction: jest.Mock;
    $executeRaw: jest.Mock;
    f_password_reset_token: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
    };
    f_user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let emailService: { sendPasswordResetEmail: jest.Mock };
  let hashService: { hashPassword: jest.Mock };
  let configService: { get: jest.Mock };
  let service: PasswordResetService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      $executeRaw: jest.fn().mockResolvedValue(1),
      f_password_reset_token: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      f_user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    );
    emailService = { sendPasswordResetEmail: jest.fn().mockResolvedValue(true) };
    hashService = { hashPassword: jest.fn().mockResolvedValue('hashed-password') };
    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
        if (key === 'FRONTEND_URL') return 'http://localhost:3001';
        return defaultValue;
      }),
    };
    service = new PasswordResetService(
      prisma as never,
      emailService as never,
      configService as never,
      hashService as never,
    );
  });

  describe('requestPasswordReset', () => {
    it('returns silently for an unknown email without sending an email', async () => {
      prisma.f_user.findUnique.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('unknown@example.com'),
      ).resolves.toBeUndefined();

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('throws 400 for a Google OAuth account', async () => {
      prisma.f_user.findUnique.mockResolvedValue({
        id: 1,
        auth_method_id: 2,
        email: 'google@example.com',
        username: 'google',
      });

      await expect(
        service.requestPasswordReset('google@example.com'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.requestPasswordReset('google@example.com'),
      ).rejects.toThrow(
        "Esta conta usa login via Google. Acesse pelo botão 'Entrar com Google'.",
      );
    });

    it('throws 429 when the hourly limit of 3 requests is reached', async () => {
      prisma.f_user.findUnique.mockResolvedValue({
        id: 1,
        auth_method_id: 1,
        email: 'owner@example.com',
        username: 'owner',
      });
      prisma.f_password_reset_token.count.mockResolvedValue(3);
      prisma.f_password_reset_token.findFirst.mockResolvedValue({
        created_at: new Date(),
      });

      let caught: unknown;
      try {
        await service.requestPasswordReset('owner@example.com');
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(HttpException);
      expect((caught as HttpException).getStatus()).toBe(429);
      const response = (caught as HttpException).getResponse() as {
        message: string;
        retryAfterSeconds: number;
      };
      expect(response.message).toBe('reset request limit exceeded');
      expect(response.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('invalidates previous tokens, creates a new one, and sends the reset email', async () => {
      prisma.f_user.findUnique.mockResolvedValue({
        id: 42,
        auth_method_id: 1,
        email: 'owner@example.com',
        username: 'owner',
      });

      await service.requestPasswordReset('owner@example.com');

      expect(prisma.f_password_reset_token.updateMany).toHaveBeenCalledWith({
        where: { user_id: 42, is_used: false },
        data: { is_used: true, used_at: expect.any(Date) },
      });
      expect(prisma.f_password_reset_token.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 42,
          token: expect.stringMatching(/^[0-9a-f]{64}$/),
          expires_at: expect.any(Date),
        }),
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'owner@example.com',
        'owner',
        expect.stringContaining('/reset-password?token='),
        1800,
      );
    });
  });

  describe('resetPassword', () => {
    it('throws 400 for an unknown token', async () => {
      prisma.f_password_reset_token.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewP@ss1'),
      ).rejects.toThrow('Link inválido ou expirado.');
    });

    it('throws 400 for an already-used token', async () => {
      prisma.f_password_reset_token.findUnique.mockResolvedValue({
        token: 'tok',
        user_id: 1,
        is_used: true,
        expires_at: new Date(Date.now() + 60_000),
      });

      await expect(
        service.resetPassword('tok', 'NewP@ss1'),
      ).rejects.toThrow('Este link já foi utilizado.');
    });

    it('throws 400 for an expired token', async () => {
      prisma.f_password_reset_token.findUnique.mockResolvedValue({
        token: 'tok',
        user_id: 1,
        is_used: false,
        expires_at: new Date(Date.now() - 60_000),
      });

      await expect(
        service.resetPassword('tok', 'NewP@ss1'),
      ).rejects.toThrow('Link expirado. Solicite um novo.');
    });

    it('hashes the new password, marks the token used, and updates the user', async () => {
      prisma.f_password_reset_token.findUnique.mockResolvedValue({
        token: 'tok',
        user_id: 42,
        is_used: false,
        expires_at: new Date(Date.now() + 60_000),
      });

      await service.resetPassword('tok', 'NewP@ss1');

      expect(hashService.hashPassword).toHaveBeenCalledWith('NewP@ss1');
      expect(prisma.f_password_reset_token.update).toHaveBeenCalledWith({
        where: { token: 'tok' },
        data: { is_used: true, used_at: expect.any(Date) },
      });
      expect(prisma.f_user.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { password_hash: 'hashed-password' },
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

From `backend/`:
```bash
npm test -- --testPathPattern=password_reset.service.spec
```

Expected: FAIL — `Cannot find module './password_reset.service'`.

- [ ] **Step 3: Create DTOs**

Create `backend/src/modules/auth/dto/forgot-password.dto.ts`:

```typescript
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

Create `backend/src/modules/auth/dto/reset-password.dto.ts`:

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

- [ ] **Step 4: Create `PasswordResetService`**

Create `backend/src/modules/auth/password_reset.service.ts`:

```typescript
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { HashService } from '../../common/services/hash.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';

const RESET_TOKEN_EXPIRATION_MINUTES = 30;
const RESET_MAX_REQUESTS_PER_HOUR = 3;
const RESET_COOLDOWN_SECONDS = 2 * 60;
const RESET_QUOTA_WINDOW_SECONDS = 60 * 60;

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
    private hashService: HashService,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.f_user.findUnique({ where: { email } });

    if (!user) {
      return;
    }

    if (user.auth_method_id !== 1) {
      throw new BadRequestException(
        "Esta conta usa login via Google. Acesse pelo botão 'Entrar com Google'.",
      );
    }

    const { token, expiresInSeconds } = await this.issueResetToken(user.id);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const userName = user.username ?? email.split('@')[0];

    const sent = await this.emailService.sendPasswordResetEmail(
      email,
      userName,
      resetUrl,
      expiresInSeconds,
    );

    if (!sent) {
      throw new BadRequestException('error sending password reset email');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const record = await this.prisma.f_password_reset_token.findUnique({
      where: { token },
    });

    if (!record) {
      throw new BadRequestException('Link inválido ou expirado.');
    }
    if (record.is_used) {
      throw new BadRequestException('Este link já foi utilizado.');
    }
    if (record.expires_at < new Date()) {
      throw new BadRequestException('Link expirado. Solicite um novo.');
    }

    const passwordHash = await this.hashService.hashPassword(password);

    await this.prisma.$transaction(async (tx) => {
      await tx.f_password_reset_token.update({
        where: { token },
        data: { is_used: true, used_at: new Date() },
      });
      await tx.f_user.update({
        where: { id: record.user_id },
        data: { password_hash: passwordHash },
      });
    });
  }

  private async issueResetToken(
    userId: number,
  ): Promise<{ token: string; expiresInSeconds: number }> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(CAST(${userId} AS bigint))`;

      const now = new Date();
      await this.enforceRateLimits(tx, userId, now);

      const expiresAt = new Date(
        now.getTime() + RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000,
      );
      const token = randomBytes(32).toString('hex');

      await tx.f_password_reset_token.updateMany({
        where: { user_id: userId, is_used: false },
        data: { is_used: true, used_at: now },
      });

      await tx.f_password_reset_token.create({
        data: { token, user_id: userId, expires_at: expiresAt },
      });

      return { token, expiresInSeconds: RESET_TOKEN_EXPIRATION_MINUTES * 60 };
    });
  }

  private async enforceRateLimits(
    tx: Prisma.TransactionClient,
    userId: number,
    now: Date,
  ): Promise<void> {
    const quotaWindowStart = new Date(
      now.getTime() - RESET_QUOTA_WINDOW_SECONDS * 1000,
    );

    const requestsLastHour = await tx.f_password_reset_token.count({
      where: { user_id: userId, created_at: { gt: quotaWindowStart } },
    });

    if (requestsLastHour >= RESET_MAX_REQUESTS_PER_HOUR) {
      const oldest = await tx.f_password_reset_token.findFirst({
        where: { user_id: userId, created_at: { gt: quotaWindowStart } },
        orderBy: { created_at: 'asc' },
        select: { created_at: true },
      });
      const retryAfterSeconds = oldest
        ? this.secondsUntil(
            new Date(
              oldest.created_at.getTime() + RESET_QUOTA_WINDOW_SECONDS * 1000,
            ),
            now,
          )
        : RESET_QUOTA_WINDOW_SECONDS;
      throw this.createRateLimitException(
        'reset request limit exceeded',
        retryAfterSeconds,
      );
    }

    const cooldownStart = new Date(
      now.getTime() - RESET_COOLDOWN_SECONDS * 1000,
    );
    const recent = await tx.f_password_reset_token.findFirst({
      where: { user_id: userId, created_at: { gt: cooldownStart } },
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    });
    if (recent) {
      const retryAfterSeconds = this.secondsUntil(
        new Date(
          recent.created_at.getTime() + RESET_COOLDOWN_SECONDS * 1000,
        ),
        now,
      );
      throw this.createRateLimitException(
        'wait for 2 minutes before sending a new request',
        retryAfterSeconds,
      );
    }
  }

  private createRateLimitException(
    message: string,
    retryAfterSeconds: number,
  ): HttpException {
    return new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private secondsUntil(target: Date, now: Date): number {
    return Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 1000));
  }
}
```

- [ ] **Step 5: Register `PasswordResetService` in `AuthModule`**

Open `backend/src/modules/auth/auth.module.ts`. Add the import:

```typescript
import { PasswordResetService } from './password_reset.service';
```

Add `PasswordResetService` to the `providers` array (alongside `EmailVerificationService`):

```typescript
providers: [
  JwtStrategy,
  GoogleStrategy,
  HashService,
  EmailVerificationService,
  PasswordResetService,   // ← add this
  EmailService,
  ConfigService,
  UsersService,
  UserRepository,
],
```

- [ ] **Step 6: Run tests to verify they pass**

From `backend/`:
```bash
npm test -- --testPathPattern=password_reset.service.spec
```

Expected: 8 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/auth/dto/forgot-password.dto.ts \
        backend/src/modules/auth/dto/reset-password.dto.ts \
        backend/src/modules/auth/password_reset.service.ts \
        backend/src/modules/auth/password_reset.service.spec.ts \
        backend/src/modules/auth/auth.module.ts
git commit -m "feat(auth): add PasswordResetService with rate limiting"
```

---

### Task 4: `AuthController` — `forgot-password` + `reset-password` endpoints

**Files:**
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.controller.spec.ts`

**Interfaces:**
- Consumes: `PasswordResetService.requestPasswordReset` and `PasswordResetService.resetPassword` (Task 3); `ForgotPasswordDto`, `ResetPasswordDto` (Task 3).
- Produces: `POST /auth/forgot-password` and `POST /auth/reset-password` HTTP endpoints — called by BFF routes in Task 5.

- [ ] **Step 1: Write the failing tests**

Open `backend/src/modules/auth/auth.controller.spec.ts`. Add `passwordResetService` mock and two new `it` blocks.

At the top of `describe`, add the mock:
```typescript
const passwordResetService = {
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
};
```

Update the `beforeEach` constructor call — add the 5th argument:
```typescript
controller = new AuthController(
  usersService as never,
  jwtService as never,
  emailVerificationService as never,
  configService as never,
  passwordResetService as never,   // ← add this
);
```

Add two new tests after the existing ones:

```typescript
it('forgotPassword always returns a generic 200 message', async () => {
  passwordResetService.requestPasswordReset.mockResolvedValue(undefined);

  const response = await controller.forgotPassword({
    email: 'owner@example.com',
  });

  expect(response).toEqual({
    message:
      'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
  });
  expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith(
    'owner@example.com',
  );
});

it('resetPassword returns a success message', async () => {
  passwordResetService.resetPassword.mockResolvedValue(undefined);

  const response = await controller.resetPassword({
    token: 'abc123',
    password: 'NewP@ss1',
  });

  expect(response).toEqual({ message: 'Senha redefinida com sucesso!' });
  expect(passwordResetService.resetPassword).toHaveBeenCalledWith(
    'abc123',
    'NewP@ss1',
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

From `backend/`:
```bash
npm test -- --testPathPattern=auth.controller.spec
```

Expected: FAIL — `controller.forgotPassword is not a function` (or `TypeError` from constructor change).

- [ ] **Step 3: Add endpoints to `AuthController`**

Open `backend/src/modules/auth/auth.controller.ts`. Add imports at the top:

```typescript
import { PasswordResetService } from './password_reset.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
```

Add `passwordResetService` to the constructor:

```typescript
constructor(
  private usersService: UsersService,
  private jwtService: JwtService,
  private emailVerificationService: EmailVerificationService,
  private configService: ConfigService,
  private passwordResetService: PasswordResetService,
) {}
```

Add the two new methods at the end of the class (before the closing `}`):

```typescript
@Post('forgot-password')
@HttpCode(HttpStatus.OK)
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  await this.passwordResetService.requestPasswordReset(dto.email);
  return {
    message:
      'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
  };
}

@Post('reset-password')
@HttpCode(HttpStatus.OK)
async resetPassword(@Body() dto: ResetPasswordDto) {
  await this.passwordResetService.resetPassword(dto.token, dto.password);
  return { message: 'Senha redefinida com sucesso!' };
}
```

- [ ] **Step 4: Run all backend tests to verify nothing is broken**

From `backend/`:
```bash
npm test
```

Expected: all tests PASS (the spec count increases by 2).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/auth/auth.controller.ts \
        backend/src/modules/auth/auth.controller.spec.ts
git commit -m "feat(auth): expose forgot-password and reset-password endpoints"
```

---

### Task 5: Zod schemas + BFF routes

**Files:**
- Modify: `frontend/src/features/auth/schemas.ts`
- Create: `frontend/src/app/api/auth/forgot-password/route.ts`
- Create: `frontend/src/app/api/auth/reset-password/route.ts`

**Interfaces:**
- Consumes: `POST /auth/forgot-password` and `POST /auth/reset-password` backend endpoints (Task 4).
- Produces:
  - `forgotPasswordSchema`, `ForgotPasswordValues` — used by `ForgotPasswordForm` (Task 6).
  - `resetPasswordSchema`, `ResetPasswordValues` — used by `ResetPasswordForm` (Task 7).
  - `POST /api/auth/forgot-password` BFF route — proxies to backend.
  - `POST /api/auth/reset-password` BFF route — proxies to backend.

- [ ] **Step 1: Add Zod schemas**

Open `frontend/src/features/auth/schemas.ts`. After the existing `export type VerificationValues` line, add:

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

- [ ] **Step 2: Verify schemas test still passes**

From `frontend/`:
```bash
npm run test:run -- src/features/auth/schemas.test.ts
```

Expected: 3 tests PASS (existing tests unchanged).

- [ ] **Step 3: Create the `forgot-password` BFF route**

Create `frontend/src/app/api/auth/forgot-password/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { normalizeApiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await backendFetch(
    "/auth/forgot-password",
    { method: "POST", body: JSON.stringify(body) },
    false,
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(normalizeApiError(response.status, payload), {
      status: response.status,
    });
  }

  return NextResponse.json({ message: payload.message });
}
```

- [ ] **Step 4: Create the `reset-password` BFF route**

Create `frontend/src/app/api/auth/reset-password/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { normalizeApiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await backendFetch(
    "/auth/reset-password",
    { method: "POST", body: JSON.stringify(body) },
    false,
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(normalizeApiError(response.status, payload), {
      status: response.status,
    });
  }

  return NextResponse.json({ message: payload.message });
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/schemas.ts \
        frontend/src/app/api/auth/forgot-password/route.ts \
        frontend/src/app/api/auth/reset-password/route.ts
git commit -m "feat(frontend): add forgot/reset password schemas and BFF routes"
```

---

### Task 6: `ForgotPasswordForm` + page

**Files:**
- Create: `frontend/src/features/auth/components/forgot-password-form.tsx`
- Create: `frontend/src/app/(auth)/forgot-password/page.tsx`

**Interfaces:**
- Consumes: `forgotPasswordSchema`, `ForgotPasswordValues` (Task 5); `POST /api/auth/forgot-password` (Task 5); `Button`, `InputGroup`, `InputGroupAddon`, `InputGroupInput`, `Label` from `@/components/ui/*`; `FieldErrors` from `./field-errors`.
- Produces: `<ForgotPasswordForm />` — rendered by the page.

- [ ] **Step 1: Create `ForgotPasswordForm`**

Create `frontend/src/features/auth/components/forgot-password-form.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import { FieldErrors } from "./field-errors";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function submit(values: ForgotPasswordValues) {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      form.setError("root", {
        message: payload.message ?? "Unable to process your request",
      });
      return;
    }

    setSubmitted(true);
  }

  const emailError = form.formState.errors.email;

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-8" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Verifique seu email
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Se o email estiver cadastrado, você receberá um link para redefinir
          sua senha em breve.
        </p>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Esqueceu sua senha?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email address</Label>
          <InputGroup className="h-11 rounded-[10px] bg-[#111113]">
            <InputGroupAddon className="pl-3">
              <Mail aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "forgot-email-error" : undefined}
              className="h-11 px-2"
              {...form.register("email")}
            />
          </InputGroup>
          <FieldErrors error={emailError} id="forgot-email-error" />
        </div>

        {form.formState.errors.root?.message ? (
          <p
            className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-[10px] text-sm font-semibold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar link de redefinição
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Lembrou sua senha?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the `forgot-password` page**

Create `frontend/src/app/(auth)/forgot-password/page.tsx`:

```tsx
import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
```

- [ ] **Step 3: Verify frontend type-checks (no test yet — tests come in Task 8)**

From `frontend/`:
```bash
npm run build 2>&1 | head -20
```

Expected: build completes without TypeScript errors on the new files (it may show other unrelated errors if any).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/auth/components/forgot-password-form.tsx \
        frontend/src/app/(auth)/forgot-password/page.tsx
git commit -m "feat(frontend): add ForgotPasswordForm and /forgot-password page"
```

---

### Task 7: `ResetPasswordForm` + page

**Files:**
- Create: `frontend/src/features/auth/components/reset-password-form.tsx`
- Create: `frontend/src/app/(auth)/reset-password/page.tsx`

**Interfaces:**
- Consumes: `resetPasswordSchema`, `ResetPasswordValues` (Task 5); `POST /api/auth/reset-password` (Task 5); `PasswordField` from `./password-field`; `useSearchParams` from `next/navigation`.
- Produces: `<ResetPasswordForm />` — rendered by the page, which wraps it in `<Suspense>` (required because `useSearchParams` triggers suspense on static rendering).

- [ ] **Step 1: Create `ResetPasswordForm`**

Create `frontend/src/features/auth/components/reset-password-form.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";
import { FieldErrors } from "./field-errors";
import { PasswordField } from "./password-field";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Link inválido
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Este link de redefinição de senha é inválido ou expirou.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Solicitar novo link
          </Link>
        </p>
      </div>
    );
  }

  async function submit(values: ResetPasswordValues) {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password: values.password }),
    });
    const payload = await response.json();

    if (!response.ok) {
      form.setError("root", {
        message: payload.message ?? "Unable to reset password",
      });
      return;
    }

    router.replace("/login?reset=success");
  }

  const passwordError = form.formState.errors.password;
  const confirmPasswordError = form.formState.errors.confirmPassword;

  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Redefinir senha
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Digite sua nova senha abaixo.
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="reset-password">Nova senha</Label>
          <PasswordField
            id="reset-password"
            aria-label="Nova senha"
            autoComplete="new-password"
            placeholder="Enter your new password"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError ? "reset-password-error" : undefined
            }
            {...form.register("password")}
          />
          <FieldErrors error={passwordError} id="reset-password-error" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password">Confirmar senha</Label>
          <PasswordField
            id="reset-confirm-password"
            aria-label="Confirmar senha"
            autoComplete="new-password"
            placeholder="Confirm your new password"
            aria-invalid={Boolean(confirmPasswordError)}
            aria-describedby={
              confirmPasswordError
                ? "reset-confirm-password-error"
                : undefined
            }
            {...form.register("confirmPassword")}
          />
          <FieldErrors
            error={confirmPasswordError}
            id="reset-confirm-password-error"
          />
        </div>

        {form.formState.errors.root?.message ? (
          <p
            className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-[10px] text-sm font-semibold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Redefinindo...
            </>
          ) : (
            <>
              Redefinir senha
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create the `reset-password` page**

Create `frontend/src/app/(auth)/reset-password/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/components/reset-password-form.tsx \
        frontend/src/app/(auth)/reset-password/page.tsx
git commit -m "feat(frontend): add ResetPasswordForm and /reset-password page"
```

---

### Task 8: Login page updates + all frontend tests

**Files:**
- Modify: `frontend/src/features/auth/components/login-form.tsx`
- Modify: `frontend/src/app/(auth)/login/page.tsx`
- Modify: `frontend/src/features/auth/components/auth-forms.test.tsx`

**Interfaces:**
- Consumes: `ForgotPasswordForm` (Task 6); `ResetPasswordForm` (Task 7); existing `LoginForm`.
- Produces: fully tested auth form suite covering all new flows.

- [ ] **Step 1: Write the failing tests**

Open `frontend/src/features/auth/components/auth-forms.test.tsx`.

At the top of the file, add `searchParams` alongside the existing `router` object and the new component imports, and update the `vi.mock` call:

```typescript
// Add alongside existing router declaration:
const searchParams = {
  get: vi.fn().mockReturnValue("reset-token-abc"),
};

// Replace the existing vi.mock("next/navigation") with:
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));
```

Add to the existing `beforeEach`:
```typescript
searchParams.get.mockReturnValue("reset-token-abc");
```

Add these imports at the top of the file alongside the existing component imports:
```typescript
import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";
```

Add these test cases inside the `describe("authentication forms", ...)` block:

```typescript
it("renders the forgot-password email field", () => {
  renderWithProviders(<ForgotPasswordForm />);

  expect(
    screen.getByRole("textbox", { name: "Email address" }),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: /Enviar link de redefinição/ }),
  ).toBeVisible();
});

it("shows the success state after a forgot-password submission", async () => {
  const user = userEvent.setup();
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify({ message: "ok" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  renderWithProviders(<ForgotPasswordForm />);

  await user.type(
    screen.getByRole("textbox", { name: "Email address" }),
    "owner@example.com",
  );
  await user.click(
    screen.getByRole("button", { name: /Enviar link de redefinição/ }),
  );

  await waitFor(() => {
    expect(screen.getByText(/Verifique seu email/)).toBeVisible();
  });
});

it("shows the Google-account error on forgot-password", async () => {
  const user = userEvent.setup();
  vi.mocked(fetch).mockResolvedValue(
    new Response(
      JSON.stringify({
        message:
          "Esta conta usa login via Google. Acesse pelo botão 'Entrar com Google'.",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    ),
  );
  renderWithProviders(<ForgotPasswordForm />);

  await user.type(
    screen.getByRole("textbox", { name: "Email address" }),
    "google@example.com",
  );
  await user.click(
    screen.getByRole("button", { name: /Enviar link de redefinição/ }),
  );

  await waitFor(() => {
    expect(screen.getByRole("alert")).toBeVisible();
  });
  expect(screen.getByRole("alert").textContent).toContain("Google");
});

it("shows the invalid-link state when no token is present in the URL", () => {
  searchParams.get.mockReturnValue(null);
  renderWithProviders(<ResetPasswordForm />);

  expect(screen.getByText("Link inválido")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Solicitar novo link" }),
  ).toBeVisible();
});

it("redirects to /login?reset=success after a successful password reset", async () => {
  const user = userEvent.setup();
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify({ message: "ok" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  renderWithProviders(<ResetPasswordForm />);

  await user.type(screen.getByLabelText("Nova senha"), "NewP@ss1");
  await user.type(screen.getByLabelText("Confirmar senha"), "NewP@ss1");
  await user.click(screen.getByRole("button", { name: /Redefinir senha/ }));

  await waitFor(() => {
    expect(router.replace).toHaveBeenCalledWith("/login?reset=success");
  });
});

it("shows an error when the reset token is invalid or expired", async () => {
  const user = userEvent.setup();
  vi.mocked(fetch).mockResolvedValue(
    new Response(
      JSON.stringify({ message: "Link expirado. Solicite um novo." }),
      { status: 400, headers: { "content-type": "application/json" } },
    ),
  );
  renderWithProviders(<ResetPasswordForm />);

  await user.type(screen.getByLabelText("Nova senha"), "NewP@ss1");
  await user.type(screen.getByLabelText("Confirmar senha"), "NewP@ss1");
  await user.click(screen.getByRole("button", { name: /Redefinir senha/ }));

  await waitFor(() => {
    expect(screen.getByRole("alert")).toBeVisible();
  });
  expect(screen.getByRole("alert").textContent).toContain("expirado");
});

it("shows the reset-success banner on the login page", () => {
  renderWithProviders(<LoginForm resetSuccess={true} />);

  expect(screen.getByRole("status")).toHaveTextContent(
    /Senha redefinida com sucesso/,
  );
});

it("renders the forgot-password link on the login form", () => {
  renderWithProviders(<LoginForm />);

  expect(
    screen.getByRole("link", { name: "Forgot password?" }),
  ).toHaveAttribute("href", "/forgot-password");
});
```

- [ ] **Step 2: Run tests to verify they fail**

From `frontend/`:
```bash
npm run test:run
```

Expected: 8 new tests FAIL (components don't have the new props/markup yet).

- [ ] **Step 3: Update `LoginForm` — add `resetSuccess` prop, success banner, and forgot-password link**

Open `frontend/src/features/auth/components/login-form.tsx`.

Update the function signature:
```typescript
export function LoginForm({
  nextPath,
  verified = false,
  resetSuccess = false,
}: {
  nextPath?: string;
  verified?: boolean;
  resetSuccess?: boolean;
}) {
```

Add the reset-success banner right after the existing `verified` banner (inside the JSX, after the `{verified ? (...) : null}` block):

```tsx
{resetSuccess ? (
  <div
    className="mt-6 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-green-300"
    role="status"
  >
    Senha redefinida com sucesso! Faça login com sua nova senha.
  </div>
) : null}
```

Replace the password label `<div className="flex items-center justify-between gap-4">` block (which currently has `<span className="text-xs text-muted-foreground">Minimum 8 characters</span>`) with:

```tsx
<div className="flex items-center justify-between gap-4">
  <Label htmlFor="login-password">Password</Label>
  <Link
    href="/forgot-password"
    className="text-xs text-primary underline-offset-4 hover:underline"
  >
    Forgot password?
  </Link>
</div>
```

- [ ] **Step 4: Update `LoginPage` — pass `resetSuccess` prop**

Open `frontend/src/app/(auth)/login/page.tsx`. Replace the file content with:

```tsx
import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    verified?: string | string[];
    reset?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : undefined;
  const verified = params.verified === "1";
  const resetSuccess = params.reset === "success";

  return <LoginForm nextPath={nextPath} verified={verified} resetSuccess={resetSuccess} />;
}
```

- [ ] **Step 5: Run all frontend tests to verify they pass**

From `frontend/`:
```bash
npm run test:run
```

Expected: all tests PASS. The suite count increases by 8 (the new tests added above).

- [ ] **Step 6: Run all backend tests to confirm no regressions**

From `backend/`:
```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/auth/components/login-form.tsx \
        frontend/src/app/(auth)/login/page.tsx \
        frontend/src/features/auth/components/auth-forms.test.tsx
git commit -m "feat(frontend): add forgot-password link, reset-success banner, and form tests"
```
