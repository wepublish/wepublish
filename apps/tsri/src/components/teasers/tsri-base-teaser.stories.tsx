import { Meta } from '@storybook/react';
import { mockArticleTeaser } from '@wepublish/storybook/mocks';

import { TsriTeaser as BaseTeaser } from './tsri-teaser';

export default {
  component: BaseTeaser,
  title: 'Blocks/Teaser',
} as Meta;

//const customTeaser = mockCustomTeaser();

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

/*
export const  = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: {
      ...customTeaser,
      preTitle: null,
    },
  },
};
*/
