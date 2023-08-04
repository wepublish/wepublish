import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {article} from '@wepublish/testing/fixtures/graphql'
import {ArticleDocument} from '@wepublish/website/api'
import {ArticleContainer} from './article-container'

export default {
  component: ArticleContainer,
  title: 'Container/Article'
} as Meta

export const ById = {
  args: {
    onQuery: action('onQuery'),
    id: article.id
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              id: article.id
            }
          },
          result: {
            data: {
              article
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
    slug: article.slug
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              slug: article.slug
            }
          },
          result: {
            data: {
              article
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
    id: article.id,
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              id: article.id
            }
          },
          result: {
            data: {
              article
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
    id: article.id,
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              id: article.id
            }
          },
          result: {
            data: {
              article
            }
          }
        }
      ]
    }
  }
}
