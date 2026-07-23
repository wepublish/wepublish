/* eslint-disable */
module.exports = {
  displayName: 'ui',
  preset: '../../jest.preset.js',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/ui',
  setupFiles: ['./setup-tests.tsx'],
  testPathIgnorePatterns: ['editor/*'],
};
