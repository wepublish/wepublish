import {Meta} from '@storybook/react'
import {Event} from './event'
import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {event} from '@wepublish/testing/fixtures/graphql'

export default {
  component: Event,
  title: 'Components/Event'
} as Meta

export const Default = {
  args: {
    data: {
      event
    }
  }
}

export const WithLoading = {
  args: {
    data: undefined,
    loading: true
  }
}

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  args: {
    data: {
      event
    },
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    data: {
      event
    },
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutImage = {
  args: {
    data: {
      event: {...event, image: null}
    }
  }
}
