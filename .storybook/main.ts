import type {StorybookConfig} from '@storybook/react-webpack5'

require('util').inspect.defaultOptions.depth = null

export default {
  addons: [
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
  babel: (config, options) => {
    config.overrides?.push({
      presets: [['@babel/preset-react', {runtime: 'automatic', importSource: '@emotion/react'}]],
      test: '*'
    })

    return config
  },
  // uncomment the property below if you want to apply some webpack config globally
  // webpackFinal: async (config, { configType }) => {
  //   // Make whatever fine-grained changes you need that should apply to all storybook configs

  //   // Return the altered config
  //   return config;
  // },
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  docs: {
    autodocs: false
  }
} as Partial<StorybookConfig>
