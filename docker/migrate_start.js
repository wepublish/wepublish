const { execFileSync } = require('child_process');

// Derive DIRECT_DATABASE_URL by replacing PgBouncer port (5432) with direct PostgreSQL port (5433).
// Prisma migrations require a direct connection (no PgBouncer) for advisory locks and prepared statements.
if (process.env.DATABASE_URL && !process.env.DIRECT_DATABASE_URL) {
  process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL.replace(':5432/', ':5433/');
}

execFileSync('node', ['node_modules/.bin/prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
execFileSync('node', ['dist/api/prisma/run-seed.js'], { stdio: 'inherit' });
