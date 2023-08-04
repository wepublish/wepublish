import {AuthorListDocument} from '@wepublish/website/api'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {AuthorListContainer} from './author-list-container'
import {css} from '@emotion/react'
import {author} from '@wepublish/testing/fixtures/graphql'

export default {
  component: AuthorListContainer,
  title: 'Container/AuthorList'
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
            query: AuthorListDocument,
            variables: {}
          },
          result: {
            data: {
              authors: {
                nodes: [author, {...author, id: '2'}, {...author, id: '3'}],
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
            query: AuthorListDocument,
            variables: {}
          },
          result: {
            data: {
              authors: {
                nodes: [author, {...author, id: '2'}, {...author, id: '3'}],
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
            query: AuthorListDocument,
            variables: {}
          },
          result: {
            data: {
              authors: {
                nodes: [author, {...author, id: '2'}, {...author, id: '3'}],
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
