import { PrismaClient } from '@prisma/client';
import { seed as rootSeed } from '../../../../api/prisma/seed';
import { hashPassword } from '../../../../api/src/lib/db/user';

async function seed() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const [adminUserRole, editorUserRole] = await rootSeed(prisma);

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done');
  }

  await prisma.user.upsert({
    where: {
      email: 'dev@wepublish.ch',
    },
    update: {},
    create: {
      email: 'dev@wepublish.ch',
      emailVerifiedAt: new Date(),
      name: 'Dev User',
      active: true,
      roleIDs: [adminUserRole.id],
      password: await hashPassword('123'),
    },
  });

  await prisma.user.upsert({
    where: {
      email: 'editor@wepublish.ch',
    },
    update: {},
    create: {
      email: 'editor@wepublish.ch',
      emailVerifiedAt: new Date(),
      name: 'Editor User',
      active: true,
      roleIDs: [editorUserRole.id],
      password: await hashPassword('123'),
    },
  });

  await prisma.$disconnect();
}

seed();
