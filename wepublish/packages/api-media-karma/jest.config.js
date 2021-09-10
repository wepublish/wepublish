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
  testURL: 'http://localhost/',
  coveragePathIgnorePatterns: ['node_modules', 'verion.ts'],
  coverageDirectory: '__tests__/coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10
    }
  }
}
