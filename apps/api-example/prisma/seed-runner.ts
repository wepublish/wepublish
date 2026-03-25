import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { bootstrap } from '../../media/src/bootstrap';
import { runExampleSeed } from './seed';

async function seed() {
  const { app } = await bootstrap(['error']);
  const prisma = new PrismaClient();
  await prisma.$connect();

  try {
    await runExampleSeed(prisma);
  } catch (e) {
    if (typeof e === 'string') {
      console.warn(e);
    } else {
      throw e;
    }
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seed();
}
