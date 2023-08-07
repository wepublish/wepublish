import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {EventDocument} from '@wepublish/website/api'
import {EventContainer} from './event-container'
import {event} from '@wepublish/testing/fixtures/graphql'

export default {
  component: EventContainer,
  title: 'Container/Event'
} as Meta

export const Default = {
  args: {
    onQuery: action('onQuery'),
    id: event.id
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventDocument,
            variables: {
              id: event.id
            }
          },
          result: {
            data: {
              event
            }
          }
        }
      ]
    }
  }
}

export const WithClassName = {
  args: {
    onQuery: action('onQuery'),
    id: event.id,
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventDocument,
            variables: {
              id: event.id
            }
          },
          result: {
            data: {
              event
            }
          }
        }
      ]
    }
  }
}

export const WithEmotion = {
  args: {
    onQuery: action('onQuery'),
    id: event.id,
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventDocument,
            variables: {
              id: event.id
            }
          },
          result: {
            data: {
              event
            }
          }
        }
      ]
    }
  }
}
