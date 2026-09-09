const nxPreset = require('@nx/jest/preset').default;

// Only the NestJS/backend libraries still run on jest, everything else is on
// vitest (see vitest.shared.ts). None of them render React, so this preset
// deliberately carries no DOM, emotion or storybook handling.
module.exports = {
  ...nxPreset,
  testEnvironment: 'node',
  globalSetup: `${__dirname}/jest.setup.ts`,
  coverageReporters: [...nxPreset.coverageReporters, 'text', 'lcov'],
  reporters: ['default', ['github-actions', { silent: false }]],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  collectCoverageFrom: ['src/**/*.{js,ts}'],
};
