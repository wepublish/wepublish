import {action} from '@storybook/addon-actions'
import {ComponentMeta, ComponentStory} from '@storybook/react'
import {ChallengeDocument} from '@wepublish/website/api'
import {PayInvoices, PayInvoicesProps} from './pay-invoices'
import {PayInvoicesContainer} from './pay-invoices-container'

export default {
  component: PayInvoices,
  title: 'PayInvoices'
} as ComponentMeta<typeof PayInvoices>

const Template = (args: PayInvoicesProps) => <PayInvoices {...args} />
export const Default = Template.bind({})

const ContainerTemplate: ComponentStory<typeof PayInvoicesContainer> = args => (
  <PayInvoicesContainer {...args} />
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
