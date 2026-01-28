import { Meta } from '@storybook/react';
import { AuthorListItem } from './author-list-item';
import { mockAuthor } from '@wepublish/storybook/mocks';

const author = mockAuthor();

export default {
  component: AuthorListItem,
  title: 'Components/AuthorList/Item',
} as Meta;

export const Default = {
  args: {
    ...author,
  },
};

export const WithoutJobTitle = {
  args: {
    ...author,
    jobTitle: null,
  },
};

export const WithoutImage = {
  args: {
    ...author,
    image: null,
  },
};
