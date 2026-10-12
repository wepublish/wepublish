import { Meta } from '@storybook/nextjs-vite';
import { Lightbox } from './lightbox';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  component: Lightbox,
  title: 'Blocks/Image Gallery/Block Styles/Lightbox',
} as Meta;

export const Default = {
  args: {
    images: [
      { image: mockImage('1'), caption: 'ABC' },
      { image: mockImage('2') },
      {
        image: mockImage('3'),
        caption:
          'Ultra Long Caption just to make sure this is rendering correctly. Because we never know what some people might write.',
      },
    ],
  },
};

export const SingleImage = {
  args: {
    images: [{ image: mockImage(), caption: 'ABC' }],
  },
};

export const DragDisabled = {
  args: {
    ...Default.args,
    dragDisabled: true,
  },
};

export const Animated = {
  args: {
    ...Default.args,
    animationDisabled: false,
  },
};

export const DragAnimationDisabled = {
  args: {
    ...Default.args,
    dragAnimationDisabled: true,
  },
};
