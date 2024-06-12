/* eslint-disable */
export default {
  displayName: 'systemInfo-api',
  preset: '../../../jest.preset.js',
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json'
      }
    ]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/systemInfo/api',
  globalSetup: '<rootDir>/setup-database.js'
}
