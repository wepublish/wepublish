import execa from 'execa'
import {displayName} from './jest.config'

export default async () => {
  const databaseUrl = `postgresql://postgres@localhost:5432/${displayName}?schema=public`
  process.env.DATABASE_URL = databaseUrl
  process.env.TZ = 'UTC'

  await execa(`npx`, ['prisma', 'migrate', 'deploy'])
}
