import { Meta } from '@storybook/react';
import { TeaserSlider } from './teaser-slider';
import {
  mockArticleTeaser,
  mockEventTeaser,
  mockPageTeaser,
} from '@wepublish/storybook/mocks';

export default {
  component: TeaserSlider,
  title: 'Blocks/Teaser List/Block Styles/Slider',
} as Meta;

export const Article = {
  args: {
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

export const WithTitle = {
  ...Article,
  args: {
    ...Article.args,
    title: 'Foobar Title',
  },
};
