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
  ]
  // uncomment the property below if you want to apply some webpack config globally
  // webpackFinal: async (config, { configType }) => {
  //   // Make whatever fine-grained changes you need that should apply to all storybook configs

  //   // Return the altered config
  //   return config;
  // },
} as any
