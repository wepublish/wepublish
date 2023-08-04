import {Meta} from '@storybook/react'
import {EventBlock} from './event-block'
import {css} from '@emotion/react'
import {event} from '@wepublish/testing/fixtures/graphql'

export default {
  component: EventBlock,
  title: 'Blocks/Event'
} as Meta

export const Default = {
  args: {
    events: [
      event,
      {...event, id: '2'},
      {...event, id: '3'},
      {...event, id: '4'},
      {...event, id: '5'},
      {...event, id: '6'}
    ]
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
