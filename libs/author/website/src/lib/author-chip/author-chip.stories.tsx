import { Meta } from '@storybook/react';
import { AuthorChip } from './author-chip';
import { mockAuthor } from '@wepublish/storybook/mocks';

const author = mockAuthor();

export default {
  component: AuthorChip,
  title: 'Components/Author Chip',
} as Meta;

export const Default = {
  args: {
    author,
  },
};

export const WithoutJobTitle = {
  args: {
    author: {
      ...author,
      jobTitle: null,
    },
  },
};

export const WithoutImage = {
  args: {
    author: {
      ...author,
      image: null,
    },
  },
};
