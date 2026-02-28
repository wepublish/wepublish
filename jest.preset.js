const { resolve } = require('path');
const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  roots: ['<rootDir>', resolve(__dirname, './__mocks__')],
  globalSetup: `${__dirname}/jest.setup.ts`,
  setupFilesAfterEnv: [`${__dirname}/jest.setup-tests.ts`],
  coverageReporters: [...nxPreset.coverageReporters, 'text', 'lcov'],
  reporters: ['default', ['github-actions', { silent: false }]],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  transformIgnorePatterns: [
    `/node_modules/(?!(react-tweet|react-player|@faker-js/faker|jose))`,
  ],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': [
      'babel-jest',
      {
        presets: [
          [
            '@nx/next/babel',
            {
              'preset-react': {
                runtime: 'automatic',
                importSource: '@emotion/react',
              },
            },
          ],
        ],
        plugins: [
          [
            '@emotion',
            {
              importMap: {
                '@mui/material': {
                  styled: {
                    canonicalImport: ['@emotion/styled', 'default'],
                    styledBaseImport: ['@mui/material', 'styled'],
                  },
                },
                '@mui/material/styles': {
                  styled: {
                    canonicalImport: ['@emotion/styled', 'default'],
                    styledBaseImport: ['@mui/material/styles', 'styled'],
                  },
                },
              },
            },
          ],
        ],
      },
    ],
  },
  snapshotSerializers: [
    ...(nxPreset.snapshotSerializers ?? []),
    __dirname + '/emotion-serializer.js',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/*.stories.{js,jsx,ts,tsx}',
  ],
};
