import {Meta} from '@storybook/react'
import {ListItem, OrderedList, UnorderedList} from './lists'

export default {
  title: 'UI/Lists'
} as Meta

export const Unordered = {
  component: UnorderedList,
  args: {
    children: (
      <>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </>
    )
  }
}

export const Ordered = {
  component: OrderedList,
  args: {
    children: (
      <>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </>
    )
  }
}
