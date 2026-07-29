import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { bootstrap } from '../../media/src/bootstrap';
import { runExampleSeed } from './seed';

async function seed() {
  const { app } = await bootstrap(['error']);
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL || 'postgresql://',
    max: parseInt(process.env['DATABASE_POOL_SIZE'] ?? '20'),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  const prisma = new PrismaClient({ adapter });
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
