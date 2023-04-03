export default {
  addons: [
    'storybook-addon-apollo-client',
    '@storybook/addon-interactions',
    '@storybook/addon-storysource',
    '@storybook/addon-a11y'
  ]
  // uncomment the property below if you want to apply some webpack config globally
  // webpackFinal: async (config, { configType }) => {
  //   // Make whatever fine-grained changes you need that should apply to all storybook configs

  //   // Return the altered config
  //   return config;
  // },
} as any
