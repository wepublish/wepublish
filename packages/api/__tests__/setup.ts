/* file for setting up the environment before any test */
import fetch from 'jest-fetch-mock'
jest.setMock('node-fetch', fetch)

// Prisma throws warning during tests because of conflicting .env files
// This is expected and there's no way to turn this off
const oldWarn = global.console.warn
global.console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Conflict for env var')) {
    return undefined
  }

  oldWarn(...args)

  return undefined
}
