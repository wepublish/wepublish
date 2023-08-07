import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {page} from '@wepublish/testing/fixtures/graphql'
import {Page} from './page'

export default {
  component: Page,
  title: 'Components/Page'
} as Meta

export const Default = {
  args: {
    data: {page},
    loading: false
  }
}

export const WithLoading = {
  args: {
    data: {
      page: null
    },
    loading: true
  }
}

export const WithError = {
  args: {
    data: {
      page: null
    },
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithoutSocialMedia = {
  args: {
    data: {
      page: {
        ...page,
        socialMediaImage: null,
        socialMediaDescription: null,
        socialMediaTitle: null
      }
    }
  }
}

export const WithoutDescription = {
  args: {
    data: {
      page: {
        ...page,
        description: null
      }
    }
  }
}

export const WithoutImageMetadata = {
  args: {
    data: {
      page: {
        ...page,
        socialMediaImage: null,
        image: null
      }
    }
  }
}
