import { Meta } from '@storybook/react';
import { mockCustomTeaser } from '@wepublish/storybook/mocks';
import { BaseTeaser } from './base-teaser';

export default {
  component: BaseTeaser,
  title: 'Blocks/Teaser/Custom',
} as Meta;

const customTeaser = mockCustomTeaser();

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: customTeaser,
  },
};

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

export const WithoutTitle = {
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
      title: null,
    },
  },
};

export const WithoutImage = {
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
      image: null,
    },
  },
};
