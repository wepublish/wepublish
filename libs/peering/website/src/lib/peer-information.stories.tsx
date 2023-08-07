import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {PeerInformation} from './peer-information'
import {peer} from '@wepublish/testing/fixtures/graphql'

export default {
  component: PeerInformation,
  title: 'Components/Peer Information'
} as Meta

export const Default = {
  args: {
    originUrl: 'https://example.com',
    data: {
      peer
    }
  }
}

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      peer: null
    },
    loading: true
  }
}

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      peer: null
    },
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
