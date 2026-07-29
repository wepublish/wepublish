import './polyfills';
import { Preview } from '@storybook/nextjs-vite';
import { decorators, parameters } from '@wepublish/storybook';

export default {
  decorators,
  parameters: {
    ...parameters,
    docs: {
      codePanel: true,
    },
  },
} as Preview;
