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
};
