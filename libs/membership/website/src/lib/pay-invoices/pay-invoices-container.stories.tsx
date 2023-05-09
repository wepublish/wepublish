import {Meta} from '@storybook/react'
import {PayInvoicesContainer} from './pay-invoices-container'
import {css} from '@emotion/react'

export default {
  component: PayInvoicesContainer,
  title: 'Container/PayInvoices'
} as Meta

export const Default = {
  args: {},

  parameters: {
    apolloClient: {
      mocks: []
    }
  }
}

export const WithClassName = {
  args: {
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: []
    }
  }
}

export const WithEmotion = {
  args: {
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: []
    }
  }
}
