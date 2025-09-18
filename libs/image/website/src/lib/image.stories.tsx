import { Meta } from '@storybook/react';
import { Image } from './image';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  component: Image,
  title: 'Components/Image',
} as Meta;

const image = mockImage();

export const Default = {
  args: {
    image,
  },
};

export const Square = {
  args: {
    image,
    square: true,
  },
};

export const WithoutDescription = {
  args: {
    image: { ...image, description: undefined },
    caption: 'Image caption',
  },
};

export const WithoutTitle = {
  args: {
    image: { ...image, title: undefined },
    caption: 'Image caption',
  },
};

export const WithMaxWidth = {
  ...Default,
  args: {
    ...Default.args,
    maxWidth: 200,
  },
};
