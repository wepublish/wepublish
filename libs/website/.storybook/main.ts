import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { configureSort } from 'storybook-multilevel-sort';
import { StorybookConfig } from '@storybook/nextjs-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

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
    name: getAbsolutePath('@storybook/nextjs-vite'),
    options: {
      nextConfigPath: join(
        dirname(fileURLToPath(import.meta.url)),
        '../../utils/website/src/lib/next.config.js'
      ),
    },
  },

  docs: {},

  stories: [
    '../../**/src/lib/**/*.mdx',
    '../../**/src/lib/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../apps/**/*.stories.@(js|jsx|ts|tsx)',
  ],

  addons: [
    'storybook-addon-apollo-client',
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-themes'),
    getAbsolutePath('storybook-react-i18next'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-docs'),
  ],

  viteFinal: async (config: any) => {
    const configDir = dirname(fileURLToPath(import.meta.url));

    config.plugins ??= [];
    config.plugins.push(
      tsconfigPaths({
        root: join(configDir, '../../..'),
        skip: dir => dir === 'dist',
      })
    );

    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mui/material-nextjs/v15-pagesRouter': join(
        configDir,
        'mui-material-nextjs-stub.tsx'
      ),
    };

    config.build ??= {};
    config.build.rollupOptions ??= {};
    const previousOnwarn = config.build.rollupOptions.onwarn;
    config.build.rollupOptions.onwarn = (warning: any, warn: any) => {
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
        return;
      }

      if (previousOnwarn) {
        previousOnwarn(warning, warn);
      } else {
        warn(warning);
      }
    };

    return config;
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      tsconfigPath: join(
        dirname(fileURLToPath(import.meta.url)),
        'tsconfig.docgen.json'
      ),
      include: [
        join(dirname(fileURLToPath(import.meta.url)), '../../**/src/**/*.tsx'),
      ],
      exclude: [
        join(
          dirname(fileURLToPath(import.meta.url)),
          '../../**/*.{spec,test,stories}.tsx'
        ),
      ],
    },
  },
} as StorybookConfig;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
