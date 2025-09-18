import { Meta } from '@storybook/react';
import { ImageGalleryBlock } from './image-gallery-block';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  component: ImageGalleryBlock,
  title: 'Blocks/Image Gallery',
} as Meta;

export const Default = {
  args: {
    images: Array.from({ length: 11 }, (_, i) => ({
      image: mockImage(),
      caption:
        'Image caption that is extremely long so it is bigger than the countainer that would display it',
    })),
  },
};

export const WithoutCaption = {
  ...Default,
  args: {
    ...Default.args,
    images: Default.args.images.map((image, index) => {
      if (!(index % 3) && !(index % 2)) {
        return { ...image, caption: '' };
      }

      return image;
    }),
  },
};
