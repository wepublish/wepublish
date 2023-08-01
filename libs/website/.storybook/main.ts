import {StorybookConfig} from '@storybook/react-webpack5'

export default {
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  docs: {
    autodocs: false
  },
  env: config => ({
    ...config,
    NODE_ENV: 'production'
  }),
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
  ]
} as StorybookConfig
