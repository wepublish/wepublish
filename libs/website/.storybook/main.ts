import {StorybookConfig} from '@storybook/react-webpack5'
import {configureSort} from 'storybook-multilevel-sort'

configureSort({
  storyOrder: {
    'getting started': {},
    components: {
      event: null
    }
  }
})

export default {
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  docs: {
    autodocs: false
  },
  stories: ['../../**/src/lib/**/*.mdx', '../../**/src/lib/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    // eslint-disable-next-line storybook/no-uninstalled-addons
    '@nx/react/plugins/storybook',
    '@storybook/addon-essentials',
    'storybook-addon-apollo-client',
    '@storybook/addon-interactions',
    {
      name: '@storybook/addon-storysource',
      options: {
        loaderOptions: {
          prettierConfig: {
            printWidth: 100,
            semi: false,
            singleQuote: true,
            bracketSpacing: false,
            jsxBracketSameLine: true,
            trailingComma: 'none',
            arrowParens: 'avoid'
          }
        }
      }
    },
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-themes',
    'storybook-react-i18next'
  ],
  webpack: (config, options) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        // The package `feed` that is used by @wepublish/feed/website uses `sax`
        // which requires a node package called `stream`, while the package is never
        // used in the browser due to tree shaking, it is included in the storybook dev server.
        // This means we have to mock it.
        stream: require.resolve('stream-browserify'),
        // Nestjs requires these
        os: false,
        crypto: false,
        zlib: false,
        querystring: false,
        http: false,
        https: false,
        net: false
      }
    }

    return config
  },
  babel: (config, options) => {
    config.overrides?.push({
      presets: [['@babel/preset-react', {runtime: 'automatic', importSource: '@emotion/react'}]],
      plugins: [
        [
          '@emotion',
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
      ],
      test: '*'
    })

    return config
  }
} as StorybookConfig
