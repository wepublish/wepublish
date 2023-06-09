import {Meta} from '@storybook/react'
import {UnorderedList, OrderedList, ListItem} from './lists'
import {ComponentProps} from 'react'

export default {
  title: 'Lists'
} as Meta

export const Unordered = {
  component: UnorderedList,
  render: (args: ComponentProps<typeof UnorderedList>) => (
    <UnorderedList {...args}>
      <ListItem>One</ListItem>
      <ListItem>Two</ListItem>
    </UnorderedList>
  )
}

export const Ordered = {
  component: OrderedList,
  render: (args: ComponentProps<typeof OrderedList>) => (
    <OrderedList {...args}>
      <ListItem>One</ListItem>
      <ListItem>Two</ListItem>
    </OrderedList>
  )
}
