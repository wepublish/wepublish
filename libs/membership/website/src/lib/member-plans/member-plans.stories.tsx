import {MemberPlans, MemberPlansProps} from './member-plans'
import {MemberPlansContainer} from './member-plans-container'
import {action} from '@storybook/addon-actions'
import {ComponentStory, ComponentMeta} from '@storybook/react'
import {MemberPlanListDocument} from '@wepublish/website/api'

export default {
  component: MemberPlans,
  title: 'MemberPlans'
} as ComponentMeta<typeof MemberPlans>

const Template = (args: MemberPlansProps) => <MemberPlans {...args} />
export const Default = Template.bind({})

const ContainerTemplate: ComponentStory<typeof MemberPlansContainer> = args => (
  <MemberPlansContainer {...args} />
)
export const WithContainer = ContainerTemplate.bind({})

WithContainer.args = {
  onQuery: action('onQuery')
}

WithContainer.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: MemberPlanListDocument
        },
        result: {
          data: {
            memberplans: {}
          }
        }
      }
    ]
  }
}
