import { createPrismaClient } from '@wepublish/testing/prisma';

async function seed() {
  const prisma = createPrismaClient();
  await prisma.$connect();
  await prisma.$disconnect();
}

seed();
