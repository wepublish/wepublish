const nxPreset = require('@nx/jest/preset').default

module.exports = {
  ...nxPreset,
  globalSetup: `${__dirname}/jest.setup.ts`,
  setupFiles: [`${__dirname}/jest.setup-libraries.ts`]
}
