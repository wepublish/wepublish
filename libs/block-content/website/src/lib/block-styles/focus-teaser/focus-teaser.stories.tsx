import { Meta } from '@storybook/react';
import { FocusTeaser } from './focus-teaser';
import {
  mockArticleTeaser,
  mockEventTeaser,
  mockPageTeaser,
} from '@wepublish/storybook/mocks';

export default {
  component: FocusTeaser,
  title: 'Blocks/Teaser List/Block Styles/Focus Teaser',
} as Meta;

export const Article = {
  args: {
    title: 'Foobar Title',
    filter: {
      tags: [],
    },
    teasers: [
      mockArticleTeaser(),
      mockArticleTeaser(),
      mockArticleTeaser(),
      mockArticleTeaser(),
      mockArticleTeaser(),
    ],
  },
};

export const Page = {
  ...Article,
  args: {
    ...Article.args,
    teasers: [
      mockPageTeaser(),
      mockPageTeaser(),
      mockPageTeaser(),
      mockPageTeaser(),
      mockPageTeaser(),
    ],
  },
};

export const Event = {
  ...Article,
  args: {
    ...Article.args,
    teasers: [
      mockEventTeaser(),
      mockEventTeaser(),
      mockEventTeaser(),
      mockEventTeaser(),
      mockEventTeaser(),
    ],
  },
};

export const WithLink = {
  ...Article,
  args: {
    ...Article.args,
    title: 'Foobar Title',
    filter: {
      tags: [Article.args.teasers[0].article?.tags[0].id],
    },
  },
};
