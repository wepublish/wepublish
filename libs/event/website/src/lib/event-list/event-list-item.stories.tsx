import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {EventListItem} from './event-list-item'
import {event} from '@wepublish/testing/fixtures/graphql'

export default {
  component: EventListItem,
  title: 'Components/EventList/Item'
} as Meta

export const Default = {
  args: {
    ...event
  }
}

export const WithClassName = {
  args: {
    ...event,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...event,
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutImage = {
  args: {
    ...event,
    image: null
  }
}
