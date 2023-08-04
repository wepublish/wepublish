import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {AuthorDocument} from '@wepublish/website/api'
import {AuthorContainer} from './author-container'
import {css} from '@emotion/react'
import {author} from '@wepublish/testing/fixtures/graphql'

export default {
  component: AuthorContainer,
  title: 'Container/Author'
} as Meta

export const ById = {
  args: {
    onQuery: action('onQuery'),
    id: author.id
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorDocument,
            variables: {
              id: author.id
            }
          },
          result: {
            data: {
              author
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
    slug: author.slug
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorDocument,
            variables: {
              slug: author.slug
            }
          },
          result: {
            data: {
              author
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
    id: author.id,
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorDocument,
            variables: {
              id: author.id
            }
          },
          result: {
            data: {
              author
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
    id: author.id,
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorDocument,
            variables: {
              id: author.id
            }
          },
          result: {
            data: {
              author
            }
          }
        }
      ]
    }
  }
}
