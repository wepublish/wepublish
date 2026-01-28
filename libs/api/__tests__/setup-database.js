import execa from 'execa';

export default async () => {
  const databaseUrl =
    'postgresql://postgres:test@localhost:5432/wepublish_test?schema=public';
  process.env.DATABASE_URL = databaseUrl;
  process.env.TZ = 'UTC';

  await execa(`npx`, ['prisma', 'migrate', 'reset', '--force'], {
    cwd: __dirname + '/..',
  });
};
