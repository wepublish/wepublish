module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsConfig: 'src/tsconfig.json'
    }
  },
  testMatch: ['**/__tests__/specs/**/*.+(ts|tsx|js)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/lib/'],
  setupFilesAfterEnv: ['./__tests__/setup.ts'],
  verbose: true,
  coveragePathIgnorePatterns: ['node_modules', 'verion.ts'],
  coverageDirectory: '__tests__/coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10
    }
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
    /**
     * manually set the exports names to load in common js, to mimic the behaviors of jest 27
     * before jest didn't fully support package exports and would load in common js code (typically via main field). now jest 28+ will load in the browser esm code, but jest esm support is not fully supported.
     * In this case we will tell jest to load in the common js code regardless of environment.
     */
    customExportConditions: ['node', 'require', 'default']
  }
}
