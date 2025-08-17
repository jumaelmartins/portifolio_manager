import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');
  await prisma.d_status.createMany({
    data: [
      { id: 1, status: 'pendente' },
      { id: 2, status: 'ativo' },
      { id: 3, status: 'inativo' },
    ],
  });
  await prisma.d_category.createMany({
    data: [
      { category: 'frontend' },
      { category: 'backend' },
      { category: 'fullstack' },
    ],
  });
  await prisma.d_roles.createMany({
    data: [{ role: 'sysadmin' }, { role: 'regular_user' }],
  });
  await prisma.d_auth_method.createMany({
    data: [{ method: 'email' }, { method: 'google' }],
  });

  if (
    process.env.ADMIN_PASSWORD &&
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_EMAIL
  ) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await prisma.f_user.createMany({
      data: [
        {
          username: process.env.ADMIN_USERNAME,
          email: process.env.ADMIN_EMAIL,
          password_hash: hashedPassword,
          auth_method_id: 1,
          role_id: 1,
          f_profile_pictureId: null,
          online: null,
          verified_email: true,
          email_verified_at: new Date(),
        },
      ],
    });
  }
  console.log('✅ Seed finalizado!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
