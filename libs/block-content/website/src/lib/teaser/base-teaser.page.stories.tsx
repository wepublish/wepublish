import { Meta } from '@storybook/react';
import { BaseTeaser } from './base-teaser';
import { mockPageTeaser } from '@wepublish/storybook/mocks';

export default {
  component: BaseTeaser,
  title: 'Blocks/Teaser/Page',
} as Meta;

const pageTeaser = mockPageTeaser();

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: pageTeaser,
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
      ...pageTeaser,
      preTitle: null,
      page: {
        ...pageTeaser.page,
        tags: [
          {
            __typename: 'Tag',
            id: '123',
            tag: 'Secondary Tag',
            main: false,
          },
          {
            __typename: 'Tag',
            id: '1234',
            tag: 'Main Tag',
            main: true,
          },
        ],
      },
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
      ...pageTeaser,
      title: null,
    },
  },
};

export const WithoutLead = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: {
      ...pageTeaser,
      lead: null,
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
      ...pageTeaser,
      image: null,
    },
  },
};

export const WithoutImageWithoutBlock = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: {
      ...pageTeaser,
      image: null,
      Page: {
        ...pageTeaser.page,
        blocks: [],
      },
    },
  },
};
