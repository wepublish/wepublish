import {StorybookConfig} from '@storybook/react-webpack5'

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
    '@storybook/addon-docs',
    '@storybook/addon-styling',
    '@storybook/addon-links',
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
        stream: require.resolve('stream-browserify')
      }
    }

    return config
  }
} as StorybookConfig
