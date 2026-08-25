import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import path from 'path';
import { syncChangelogs } from './sync-changelogs';

// Changelogs path: repo uses libs/api/changelogs/, Docker containers use changelogs/
const resolveChangelogsDirectory = (): string => {
  if (process.env.CHANGELOGS_DIR) {
    return process.env.CHANGELOGS_DIR;
  }

  const candidates = [
    path.join(process.cwd(), 'libs/api/changelogs'),
    path.join(process.cwd(), 'changelogs'),
  ];
  const directory = candidates.find(candidate => existsSync(candidate));

  if (!directory) {
    throw new Error(
      `No changelogs directory found. Checked: ${candidates.join(', ')}`
    );
  }

  return directory;
};

export async function runSyncChangelogs() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Locally, run this via `npm run changelog:sync` (which loads .env); in containers the environment provides it.'
    );
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env['DATABASE_POOL_SIZE'] ?? '20'),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  try {
    const result = await syncChangelogs(prisma, resolveChangelogsDirectory());

    console.log(
      `Changelogs synced: ${result.created.length} created, ${result.updated.length} updated, ${result.unchanged.length} unchanged`
    );

    for (const { name, error } of result.errors) {
      console.error(`Changelog "${name}" could not be synced:`, error);
    }

    if (result.errors.length > 0) {
      throw new Error(
        `Changelog sync failed for: ${result.errors.map(({ name }) => name).join(', ')}`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

runSyncChangelogs()
  .then(() => {
    console.log('Changelog sync applied successfully');
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
