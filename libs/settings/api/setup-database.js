import config from './jest.config'

export default async () => {
  const databaseUrl = `postgresql://postgres@localhost:5432/${config.displayName}?schema=public`
  process.env.DATABASE_URL = databaseUrl
  process.env.TZ = 'UTC'
}
