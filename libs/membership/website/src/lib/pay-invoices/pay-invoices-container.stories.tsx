import {ComponentStory, Meta} from '@storybook/react'
import {PayInvoicesContainer} from './pay-invoices-container'
import {css} from '@emotion/react'

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

export const WithEmotion = Template.bind({})

WithEmotion.args = {
  css: css`
    background-color: #eee;
  `
} as any // The css prop comes from the WithConditionalCSSProp type by the Emotion JSX Pragma

WithEmotion.parameters = {
  apolloClient: {
    mocks: []
  }
}
