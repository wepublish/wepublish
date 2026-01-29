import { configureSort } from 'storybook-multilevel-sort';
import { StorybookConfig } from 'storybook/internal/types';

configureSort({
  storyOrder: {
    'getting started': {},
    components: {
      event: null,
    },
  },
});

export default {
  framework: {
    name: '@storybook/nextjs',
  },

  docs: {},

  stories: [
    '../../**/src/lib/**/*.mdx',
    '../../**/src/lib/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../apps/**/*.stories.@(js|jsx|ts|tsx)',
  ],

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
            arrowParens: 'avoid',
          },
        },
      },
    },
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-themes',
    'storybook-react-i18next',
    '@chromatic-com/storybook',
  ],

  webpackFinal: async (config: any) => {
    config.module.rules.push({
      test: /\.[jt]sx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-react',
              {
                runtime: 'automatic',
                importSource: '@emotion/react',
              },
            ],
            '@babel/preset-typescript',
          ],
          plugins: ['@emotion/babel-plugin'],
        },
      },
    });

    return config;
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
} as StorybookConfig;
