import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {MemberPlanListDocument} from '@wepublish/website/api'
import {MemberPlansContainer} from './member-plans-container'

export default {
  component: MemberPlansContainer,
  title: 'Container/MemberPlans'
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
}
