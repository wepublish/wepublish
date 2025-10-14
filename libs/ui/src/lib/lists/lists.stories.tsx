import { Stack } from '@mui/material';
import { Meta } from '@storybook/react';

import { ListItem, OrderedList, UnorderedList } from './lists';

export default {
  component: ListItem,
  title: 'UI/Lists',
  render: () => (
    <Stack
      gap={1}
      alignItems={'start'}
    >
      <UnorderedList>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </UnorderedList>

      <OrderedList>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </OrderedList>
    </Stack>
  ),
} as Meta;

export const Lists = {};
