import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {page} from '@wepublish/testing/fixtures/graphql'
import {PageDocument} from '@wepublish/website/api'
import {PageContainer} from './page-container'

export default {
  component: PageContainer,
  title: 'Container/Page'
} as Meta

export const ById = {
  args: {
    onQuery: action('onQuery'),
    id: page.id
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}

export const BySlug = {
  args: {
    onQuery: action('onQuery'),
    slug: page.slug
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              slug: page.slug
            }
          },
          result: {
            data: {
              page
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
    id: page.id,
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}

export const WithEmotion = {
  args: {
    onQuery: action('onQuery'),
    id: page.id,
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}
