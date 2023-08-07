import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {article} from '@wepublish/testing/fixtures/graphql'
import {Article} from './article'

export default {
  component: Article,
  title: 'Components/Article'
} as Meta

export const Default = {
  args: {
    data: {article}
  }
}

export const WithLoading = {
  args: {
    data: {
      article: null
    },
    loading: true
  }
}

export const WithError = {
  args: {
    data: {
      article: null
    },
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  args: {
    data: {article},
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    data: {article},
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutAuthors = {
  args: {
    data: {
      article: {
        ...article,
        authors: []
      }
    }
  }
}

export const WithoutSocialMedia = {
  args: {
    data: {
      article: {
        ...article,
        socialMediaImage: null,
        socialMediaDescription: null,
        socialMediaTitle: null
      }
    }
  }
}

export const WithoutLead = {
  args: {
    data: {
      article: {
        ...article,
        lead: null
      }
    }
  }
}

export const WithoutImageMetadata = {
  args: {
    data: {
      article: {
        ...article,
        socialMediaImage: null,
        image: null
      }
    }
  }
}
