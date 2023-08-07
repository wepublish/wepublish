import {EventListDocument} from '@wepublish/website/api'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {EventListContainer} from './event-list-container'
import {css} from '@emotion/react'
import {event} from '@wepublish/testing/fixtures/graphql'

export default {
  component: EventListContainer,
  title: 'Container/EventList'
} as Meta

export const Default = {
  args: {
    onQuery: action('onQuery')
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventListDocument,
            variables: {}
          },
          result: {
            data: {
              events: {
                nodes: [event, {...event, id: '2'}, {...event, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
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
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventListDocument,
            variables: {}
          },
          result: {
            data: {
              events: {
                nodes: [event, {...event, id: '2'}, {...event, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
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
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventListDocument,
            variables: {}
          },
          result: {
            data: {
              events: {
                nodes: [event, {...event, id: '2'}, {...event, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
            }
          }
        }
      ]
    }
  }
}
