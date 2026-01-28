import { Meta, StoryObj } from '@storybook/react';
import { ImageUpload } from './image-upload';
import { ComponentProps } from 'react';
import { action } from '@storybook/addon-actions';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  component: ImageUpload,
  title: 'Components/Image Upload',
} as Meta<typeof ImageUpload>;

export const Default: StoryObj<ComponentProps<typeof ImageUpload>> = {
  args: {
    onUpload: action('onUpload'),
    image: mockImage(),
  },
};

export const NoImage: StoryObj<ComponentProps<typeof ImageUpload>> = {
  ...Default,
  args: {
    ...Default.args,
    image: null,
  },
};
