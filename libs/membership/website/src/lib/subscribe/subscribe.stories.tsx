import {action} from '@storybook/addon-actions'
import {ComponentMeta, ComponentStory} from '@storybook/react'
import {ChallengeDocument} from '@wepublish/website/api'
import {Subscribe, SubscribeProps} from './subscribe'
import {SubscribeContainer} from './subscribe-container'

export default {
  component: Subscribe,
  title: 'Subscribe'
} as ComponentMeta<typeof Subscribe>

const Template = (args: SubscribeProps) => <Subscribe {...args} />
export const Default = Template.bind({})

const ContainerTemplate: ComponentStory<typeof SubscribeContainer> = args => (
  <SubscribeContainer {...args} />
)
export const WithContainer = ContainerTemplate.bind({})

WithContainer.args = {
  onChallengeQuery: action('onChallengeQuery')
}

WithContainer.parameters = {
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
