module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      isolatedModules: true
    }
  },
  testMatch: ['**/__tests__/specs/**/*.+(ts|tsx|js)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/lib/'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  setupFilesAfterEnv: ['./__tests__/setup.ts'],
  verbose: true,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': 'identity-obj-proxy'
  },
  coveragePathIgnorePatterns: ['node_modules', 'verion.ts'],
  coverageDirectory: '__tests__/coverage',
  testEnvironment: 'jsdom',
  /**
   * manually set the exports names to load in common js, to mimic the behaviors of jest 27
   * before jest didn't fully support package exports and would load in common js code (typically via main field). now jest 28+ will load in the browser esm code, but jest esm support is not fully supported.
   * In this case we will tell jest to load in the common js code regardless of environment.
   */
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
    url: 'http://localhost/'
  }
}
