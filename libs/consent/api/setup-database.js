import execa from 'execa'
import {name} from './jest.config'

export default async () => {
  const databaseUrl = `postgresql://postgres@localhost:5432/${name}?schema=public`
  process.env.DATABASE_URL = databaseUrl
  process.env.TZ = 'UTC'

  await execa(`npx`, ['prisma', 'migrate', 'deploy'])
}
