import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {ChallengeDocument} from '@wepublish/website/api'
import {SubscribeContainer} from './subscribe-container'
import {css} from '@emotion/react'

export default {
  component: SubscribeContainer,
  title: 'Container/Subscribe'
} as Meta

export const Default = {
  args: {
    onChallengeQuery: action('onChallengeQuery'),
    onSubscribeMutation: action('onSubscribeMutation'),
    onMemberPlansQuery: action('onMemberPlansQuery')
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            data: {}
          }
        }
      ]
    }
  }
}

export const WithClassName = {
  args: {
    onChallengeQuery: action('onChallengeQuery'),
    onSubscribeMutation: action('onSubscribeMutation'),
    onMemberPlansQuery: action('onMemberPlansQuery'),
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            data: {}
          }
        }
      ]
    }
  }
}

export const WithEmotion = {
  args: {
    onChallengeQuery: action('onChallengeQuery'),
    onSubscribeMutation: action('onSubscribeMutation'),
    onMemberPlansQuery: action('onMemberPlansQuery'),
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            data: {}
          }
        }
      ]
    }
  }
}
