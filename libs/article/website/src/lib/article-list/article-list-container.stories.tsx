import {ArticleListDocument} from '@wepublish/website/api'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {ArticleListContainer} from './article-list-container'
import {css} from '@emotion/react'
import {article} from '@wepublish/testing/fixtures/graphql'

export default {
  component: ArticleListContainer,
  title: 'Container/ArticleList'
} as Meta

export const Default = {
  args: {
    onQuery: action('onQuery')
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleListDocument,
            variables: {}
          },
          result: {
            data: {
              articles: {
                nodes: [article, {...article, id: '2'}, {...article, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
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
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleListDocument,
            variables: {}
          },
          result: {
            data: {
              articles: {
                nodes: [article, {...article, id: '2'}, {...article, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
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
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleListDocument,
            variables: {}
          },
          result: {
            data: {
              articles: {
                nodes: [article, {...article, id: '2'}, {...article, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
            }
          }
        }
      ]
    }
  }
}
