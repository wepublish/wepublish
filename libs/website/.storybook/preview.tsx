import { Preview } from '@storybook/nextjs';
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
