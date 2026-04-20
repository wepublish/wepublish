import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'prisma/config';

// Load .env file for local development (prisma migrate dev, prisma db seed, etc.)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]?.replace(/^['"]|['"]$/g, '') ?? '';
    }
  }
}

// Schema path: repo uses libs/api/prisma/, Docker containers use prisma/
const repoSchemaPath = path.join(__dirname, 'libs/api/prisma/schema.prisma');
const dockerSchemaPath = path.join(__dirname, 'prisma/schema.prisma');
const schemaPath = fs.existsSync(repoSchemaPath)
  ? repoSchemaPath
  : dockerSchemaPath;

// DIRECT_DATABASE_URL bypasses PgBouncer (port 5433 instead of 5432).
// Prisma migrations require a direct connection for advisory locks and prepared statements.
// In production, migrate_start.js derives DIRECT_DATABASE_URL from DATABASE_URL if not set.
const migrateUrl =
  process.env['DIRECT_DATABASE_URL'] || process.env['DATABASE_URL']!;

export default defineConfig({
  schema: schemaPath,
  migrations: {
    seed: 'nx seed api-example --prod',
  },
  datasource: {
    url: migrateUrl,
  },
});
