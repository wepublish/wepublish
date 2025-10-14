import { Meta } from '@storybook/react';
import { TeaserListBlock } from './teaser-list-block';
import {
  mockEventTeaser,
  mockPageTeaser,
  mockTeaserListBlock,
} from '@wepublish/storybook/mocks';

export default {
  component: TeaserListBlock,
  title: 'Blocks/Teaser List',
} as Meta;

export const Article = {
  args: mockTeaserListBlock(),
};

export const Page = {
  ...Article,
  args: mockTeaserListBlock({
    teasers: [mockPageTeaser(), mockPageTeaser(), mockPageTeaser()],
  }),
};

export const Event = {
  ...Article,
  args: mockTeaserListBlock({
    teasers: [mockEventTeaser(), mockEventTeaser(), mockEventTeaser()],
  }),
};

export const WithTitle = {
  ...Article,
  args: {
    ...Article.args,
    title: 'Foobar Title',
  },
};
