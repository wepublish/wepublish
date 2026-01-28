import { Meta } from '@storybook/react';
import { BaseTeaser } from './base-teaser';
import { mockCustomTeaser } from '@wepublish/storybook/mocks';

export default {
  component: BaseTeaser,
  title: 'Blocks/Teaser',
} as Meta;

const customTeaser = mockCustomTeaser();

export const WithoutPreTitle = {
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
