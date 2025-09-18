import { Meta } from '@storybook/react';
import { ListicleBlock } from './listicle-block';
import {
  mockImage,
  mockListicleBlock,
  mockRichText,
} from '@wepublish/storybook/mocks';

export default {
  component: ListicleBlock,
  title: 'Blocks/Listicle',
} as Meta;

export const Default = {
  args: mockListicleBlock(),
};

export const WithoutImage = {
  args: mockListicleBlock({
    items: [
      {
        title: 'Foobar',
        richText: mockRichText(),
        image: mockImage(),
      },
      {
        title: 'Foobar',
        richText: mockRichText(),
      },
      {
        title: 'Foobar',
        richText: mockRichText(),
        image: mockImage(),
      },
      {
        title: 'Foobar',
        richText: mockRichText(),
      },
    ],
  }),
};
