import { Meta } from '@storybook/react';
import { BaseTeaser } from './base-teaser';
import { mockEventTeaser } from '@wepublish/storybook/mocks';

export default {
  component: BaseTeaser,
  title: 'Blocks/Teaser/Event',
} as Meta;

const eventTeaser = mockEventTeaser();

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: eventTeaser,
  },
};

export const WithoutDescription = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: {
      ...eventTeaser,
      lead: null,
    },
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
      ...eventTeaser,
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
      ...eventTeaser,
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
      ...eventTeaser,
      image: null,
    },
  },
};

export const WithoutImageWithoutEventImage = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: {
      ...eventTeaser,
      image: null,
      event: {
        ...eventTeaser.event,
        image: null,
      },
    },
  },
};
