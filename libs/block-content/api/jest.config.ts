/* eslint-disable */
export default {
  displayName: 'block-content-api',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@faker-js/faker$': '<rootDir>/../../../__mocks__/faker.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/block-content/api',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.model.ts',
    '!src/**/*.resolver.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
