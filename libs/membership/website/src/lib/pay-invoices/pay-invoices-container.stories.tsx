import {ComponentStory, Meta} from '@storybook/react'
import {PayInvoicesContainer} from './pay-invoices-container'

export default {
  component: PayInvoicesContainer,
  title: 'Container/PayInvoices'
} as Meta

const Template: ComponentStory<typeof PayInvoicesContainer> = args => (
  <PayInvoicesContainer {...args} />
)
export const Default = Template.bind({})

Default.args = {}

Default.parameters = {
  apolloClient: {
    mocks: []
  }
}

export const WithClassName = Template.bind({})

WithClassName.args = {
  className: 'extra-classname'
}

WithClassName.parameters = {
  apolloClient: {
    mocks: []
  }
}
