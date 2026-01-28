import { Meta } from '@storybook/react';
import { QuoteBlock } from './quote-block';
import { mockQuoteBlock } from '@wepublish/storybook/mocks';

export default {
  component: QuoteBlock,
  title: 'Blocks/Quote',
} as Meta;

export const Default = {
  args: mockQuoteBlock({
    image: null,
  }),
};

export const WithImage = {
  args: mockQuoteBlock(),
};

export const WithImageAndShortText = {
  args: mockQuoteBlock({
    quote: 'This is a quote.',
  }),
};
