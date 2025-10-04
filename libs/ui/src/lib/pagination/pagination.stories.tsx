import { Meta, StoryObj } from '@storybook/react';
import { ComponentProps } from 'react';

import { Pagination as PaginationCmp } from './pagination';

export default {
  component: PaginationCmp,
  title: 'UI/Pagination',
} as Meta<typeof PaginationCmp>;

export const Pagination: StoryObj<ComponentProps<typeof PaginationCmp>> = {
  args: {
    count: 10,
  },
};
