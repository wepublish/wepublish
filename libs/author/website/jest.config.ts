/* eslint-disable */
export default {
  displayName: 'author-website',
  preset: '../../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': [
      '@swc/jest',
      {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
              importSource: '@emotion/react'
            }
          },
          experimental: {
            cacheRoot: 'node_modules/.cache/swc',
            plugins: [
              [
                '@swc/plugin-emotion',
                {
                  importMap: {
                    '@mui/material': {
                      styled: {
                        canonicalImport: ['@emotion/styled', 'default'],
                        styledBaseImport: ['@mui/material', 'styled']
                      }
                    },
                    '@mui/material/styles': {
                      styled: {
                        canonicalImport: ['@emotion/styled', 'default'],
                        styledBaseImport: ['@mui/material/styles', 'styled']
                      }
                    }
                  }
                }
              ]
            ]
          }
        }
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/author/website',
  setupFiles: ['./setup-tests.tsx']
}
