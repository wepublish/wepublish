import execa from 'execa'

export default async () => {
  const databaseUrl = `postgresql://postgres@localhost:5432/wepublish_test?schema=public`
  process.env.DATABASE_URL = databaseUrl

  await execa(`npx`, ['prisma', 'migrate', 'reset', '--force'])
}
