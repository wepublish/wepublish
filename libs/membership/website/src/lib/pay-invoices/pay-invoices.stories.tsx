import {ComponentStory, Meta} from '@storybook/react'
import {PayInvoices} from './pay-invoices'

export default {
  component: PayInvoices,
  title: 'Components/PayInvoices'
} as Meta

const Template: ComponentStory<typeof PayInvoices> = args => <PayInvoices {...args} />
export const Default = Template.bind({})
