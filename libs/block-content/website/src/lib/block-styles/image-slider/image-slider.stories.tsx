import { Meta } from '@storybook/react';
import { ImageSlider } from './image-slider';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  component: ImageSlider,
  title: 'Blocks/Image Gallery/Block Styles/Slider',
} as Meta;

export const Default = {
  args: {
    images: [
      { image: mockImage(), caption: 'ABC' },
      { image: mockImage() },
      {
        image: mockImage(),
        caption:
          'Ultra Long Caption just to make sure this is rendering correctly. Because we never know what some people might write.',
      },
    ],
  },
};
