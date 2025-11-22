import { Meta } from '@storybook/react';
import { ArticleAuthor as ArticleAuthorCmp } from './article-author';
import { mockAuthor } from '@wepublish/storybook/mocks';

const author = mockAuthor();

export default {
  component: ArticleAuthorCmp,
  title: 'Components/ArticleAuthor',
} as Meta;

export const ArticleAuthor = {
  args: {
    author,
  },
};
