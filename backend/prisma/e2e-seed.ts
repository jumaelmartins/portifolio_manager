import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const prisma = new PrismaClient();
const verificationToken = 'e2e-verification-token'.padEnd(64, '0');

async function main() {
  const [pending, active, regular, emailMethod] = await Promise.all([
    prisma.d_status.upsert({
      where: { status: 'pendente' },
      update: {},
      create: { id: 1, status: 'pendente' },
    }),
    prisma.d_status.upsert({
      where: { status: 'ativo' },
      update: {},
      create: { id: 2, status: 'ativo' },
    }),
    prisma.d_roles.upsert({
      where: { role: 'regular_user' },
      update: {},
      create: { id: 2, role: 'regular_user' },
    }),
    prisma.d_auth_method.upsert({
      where: { method: 'email' },
      update: {},
      create: { id: 1, method: 'email' },
    }),
  ]);

  await Promise.all(
    ['Full Stack', 'Backend'].map((category) =>
      prisma.d_category.upsert({
        where: { category },
        update: {},
        create: { category },
      }),
    ),
  );
  await Promise.all(
    ['TypeScript', 'NestJS', 'PostgreSQL'].map((tech) =>
      prisma.d_technologies.upsert({
        where: { tech },
        update: {},
        create: { tech },
      }),
    ),
  );

  const password_hash = await bcrypt.hash('E2eStrongP@ss1', 12);
  const verified = await prisma.f_user.upsert({
    where: { email: 'e2e@portfolio.test' },
    update: {
      password_hash,
      status_id: active.id,
      verified_email: true,
      email_verified_at: new Date(),
    },
    create: {
      username: 'e2e_user',
      email: 'e2e@portfolio.test',
      password_hash,
      role_id: regular.id,
      status_id: active.id,
      auth_method_id: emailMethod.id,
      verified_email: true,
      email_verified_at: new Date(),
    },
  });

  const verificationUser = await prisma.f_user.upsert({
    where: { email: 'verify@portfolio.test' },
    update: {
      password_hash,
      status_id: pending.id,
      verified_email: false,
      email_verified_at: null,
    },
    create: {
      username: 'verify_user',
      email: 'verify@portfolio.test',
      password_hash,
      role_id: regular.id,
      status_id: pending.id,
      auth_method_id: emailMethod.id,
      verified_email: false,
    },
  });

  await prisma.f_user.deleteMany({
    where: {
      email: {
        startsWith: 'register-',
        endsWith: '@portfolio.test',
      },
    },
  });
  await prisma.f_projects.deleteMany({ where: { f_userId: verified.id } });
  await prisma.f_experience.deleteMany({ where: { f_userId: verified.id } });
  await prisma.f_education.deleteMany({ where: { f_userId: verified.id } });
  await prisma.f_education.createMany({
    data: Array.from({ length: 12 }, (_, index) => {
      const label = String(index + 1).padStart(2, '0');
      return {
        title: `Seeded Education ${label}`,
        institution_name: `Seeded University ${label}`,
        description: null,
        start_date: new Date(`${2013 + index}-01-01T00:00:00.000Z`),
        end_date: null,
        current: false,
        f_userId: verified.id,
      };
    }),
  });
  await prisma.f_courses.deleteMany({ where: { f_userId: verified.id } });
  // custom_section_item rows cascade when their section is removed.
  await prisma.custom_section.deleteMany({ where: { user_id: verified.id } });
  await prisma.f_images.deleteMany({ where: { f_userId: verified.id } });
  // Throwaway lookups created by e2e specs (E2E-prefixed) — never the seeded
  // globals. Cleared here so lookup specs stay deterministic across runs.
  // The API lowercases lookup names on save, so match case-insensitively;
  // technologies aren't user-deletable, so the seed is their only cleanup.
  await prisma.d_category.deleteMany({
    where: { category: { startsWith: 'e2e ', mode: 'insensitive' } },
  });
  await prisma.d_technologies.deleteMany({
    where: { tech: { startsWith: 'e2e ', mode: 'insensitive' } },
  });
  await rm(join(process.cwd(), 'uploads', String(verified.id)), {
    recursive: true,
    force: true,
  });
  await prisma.f_email_verification_token.deleteMany({
    where: { user_id: verificationUser.id },
  });
  await prisma.f_email_verification_token.create({
    data: {
      token: verificationToken,
      code: '123456',
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
