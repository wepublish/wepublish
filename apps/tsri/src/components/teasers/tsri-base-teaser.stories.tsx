import { Meta } from '@storybook/react';
import { mockArticleTeaser } from '@wepublish/storybook/mocks';

import { TsriTeaser as BaseTeaser } from './tsri-teaser';

export default {
  component: BaseTeaser,
  title: 'Tsri/Blocks/Teaser',
} as Meta;

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: mockArticleTeaser(),
  },
};
