import {action} from '@storybook/addon-actions'
import {ComponentStory, Meta} from '@storybook/react'
import {MemberPlanListDocument} from '@wepublish/website/api'
import {MemberPlans} from './member-plans'
import {MemberPlansContainer} from './member-plans-container'

export default {
  component: MemberPlans,
  title: 'Container/MemberPlans'
} as Meta

const Template: ComponentStory<typeof MemberPlansContainer> = args => (
  <MemberPlansContainer {...args} />
)
export const Default = Template.bind({})

Default.args = {
  onQuery: action('onQuery')
}

Default.parameters = {
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

export const WithClassName = Template.bind({})

WithClassName.args = {
  onQuery: action('onQuery'),
  className: 'extra-classname'
}

WithClassName.parameters = {
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
