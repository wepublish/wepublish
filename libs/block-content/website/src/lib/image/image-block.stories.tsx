import { Meta } from '@storybook/react';
import { ImageBlock } from './image-block';
import { mockImage, mockImageBlock } from '@wepublish/storybook/mocks';

export default {
  component: ImageBlock,
  title: 'Blocks/Image',
} as Meta;

export const Default = {
  args: mockImageBlock(),
};

export const WithoutCaption = {
  ...Default,
  args: {
    ...Default.args,
    caption: '',
  },
};

export const WithoutSource = {
  ...Default,
  args: {
    ...Default.args,
    image: {
      ...mockImage(),
      source: '',
    },
  },
};

export const WithLink = {
  ...Default,
  args: {
    ...Default.args,
    linkUrl: 'https://example.com',
  },
};
