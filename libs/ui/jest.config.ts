/* eslint-disable */
export default {
  displayName: 'ui',
  preset: '../../jest.preset.js',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/ui',
  setupFiles: ['./setup-tests.tsx'],
  testPathIgnorePatterns: ['editor/*'],
};
