import {Meta} from '@storybook/react'
import {ListItem, OrderedList, UnorderedList} from './lists'
import {Stack} from '@mui/material'

export default {
  component: ListItem,
  title: 'UI/Lists',
  render: () => (
    <Stack gap={1} alignItems={'start'}>
      <UnorderedList>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </UnorderedList>

      <OrderedList>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </OrderedList>
    </Stack>
  )
} as Meta

export const Lists = {}
