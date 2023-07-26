const nxPreset = require('@nx/jest/preset').default

module.exports = {
  ...nxPreset,
  globalSetup: `${__dirname}/jest.setup.ts`,
  coverageReporters: [...nxPreset.coverageReporters, 'text'],
  reporters: ['default', ['github-actions', {silent: false}]],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']
}
