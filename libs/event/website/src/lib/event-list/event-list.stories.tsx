import {Meta} from '@storybook/react'
import {EventList} from './event-list'
import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {event} from '@wepublish/testing/fixtures/graphql'

export default {
  component: EventList,
  title: 'Components/EventList'
} as Meta

export const Default = {
  args: {
    data: {
      events: {
        nodes: [
          event,
          {...event, id: '2'},
          {...event, id: '3'},
          {...event, id: '4'},
          {...event, id: '5'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    variables: {
      take: 10
    },
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithLoading = {
  args: {
    data: undefined,
    loading: true,
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    }),
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithClassName = {
  args: {
    data: {
      events: {
        nodes: [
          event,
          {...event, id: '2'},
          {...event, id: '3'},
          {...event, id: '4'},
          {...event, id: '5'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    className: 'extra-classname',
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithEmotion = {
  args: {
    data: {
      events: {
        nodes: [
          event,
          {...event, id: '2'},
          {...event, id: '3'},
          {...event, id: '4'},
          {...event, id: '5'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    css: css`
      background-color: #eee;
    `,
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithoutImage = {
  args: {
    data: {
      events: {
        nodes: [
          {...event, image: null},
          {...event, id: '2'},
          {...event, id: '3', image: null},
          {...event, id: '4'},
          {...event, id: '5', image: null}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    onVariablesChange: action('onVariablesChange')
  }
}
