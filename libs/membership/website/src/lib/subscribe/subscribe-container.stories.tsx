import {action} from '@storybook/addon-actions'
import {ComponentStory, Meta} from '@storybook/react'
import {ChallengeDocument} from '@wepublish/website/api'
import {SubscribeContainer} from './subscribe-container'
import {css} from '@emotion/react'

export default {
  component: SubscribeContainer,
  title: 'Container/Subscribe'
} as Meta

const Template: ComponentStory<typeof SubscribeContainer> = args => <SubscribeContainer {...args} />
export const Default = Template.bind({})

Default.args = {
  onChallengeQuery: action('onChallengeQuery'),
  onSubscribeMutation: action('onSubscribeMutation'),
  onMemberPlansQuery: action('onMemberPlansQuery')
}

Default.parameters = {
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

export const WithClassName = Template.bind({})

WithClassName.args = {
  onChallengeQuery: action('onChallengeQuery'),
  onSubscribeMutation: action('onSubscribeMutation'),
  onMemberPlansQuery: action('onMemberPlansQuery'),
  className: 'extra-classname'
}

WithClassName.parameters = {
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

export const WithEmotion = Template.bind({})

WithEmotion.args = {
  onChallengeQuery: action('onChallengeQuery'),
  onSubscribeMutation: action('onSubscribeMutation'),
  onMemberPlansQuery: action('onMemberPlansQuery'),
  css: css`
    background-color: #eee;
  `
} as any // The css prop comes from the WithConditionalCSSProp type by the Emotion JSX Pragma

WithEmotion.parameters = {
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
