import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
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
    name: getAbsolutePath("@storybook/nextjs-vite"),
  },

  docs: {},

  stories: [
    '../../**/src/lib/**/*.mdx',
    '../../**/src/lib/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../apps/**/*.stories.@(js|jsx|ts|tsx)',
  ],

  addons: [
    getAbsolutePath("@nx/react/plugins/storybook"),
    getAbsolutePath("storybook-addon-apollo-client"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-themes"),
    getAbsolutePath("storybook-react-i18next"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-docs")
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

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
