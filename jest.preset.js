const nxPreset = require('@nx/jest/preset').default

module.exports = {
  ...nxPreset,
  globalSetup: `${__dirname}/jest.setup.ts`,
  coverageReporters: [...nxPreset.coverageReporters, 'text', 'json']
}
