/* eslint-disable */
export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/api',
  setupFilesAfterEnv: ['./__tests__/setup.ts'],
  globalSetup: '<rootDir>/__tests__/setup-database.js',
  collectCoverageFrom: ['!**/*'],
};
