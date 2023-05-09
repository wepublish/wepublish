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
    '@storybook/addon-docs'
  ],
  // babel: (config, options) => {
  //   console.log(config)

  //   return {
  //     ...config,
  //     presets: [...(config.presets ?? []), '@emotion/babel-preset-css-prop']
  //   }
  // },
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
    autodocs: true
  },
  features: {
    storyStoreV7: false, // 👈 Opt out of on-demand story loading
    emotionAlias: false
  }
} as Partial<StorybookConfig>
