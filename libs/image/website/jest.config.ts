/* eslint-disable */
export default {
  displayName: 'image-website',
  preset: '../../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': ['@swc/jest', {jsc: {transform: {react: {runtime: 'automatic'}}}}]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/image/website',
  setupFiles: ['./setup-tests.tsx']
}
