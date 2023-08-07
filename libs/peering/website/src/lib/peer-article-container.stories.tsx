import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {article, peer} from '@wepublish/testing/fixtures/graphql'
import {PeerArticleContainer} from './peer-article-container'

import {PeerArticleDocument, PeerDocument} from '@wepublish/website/api'

export default {
  component: PeerArticleContainer,
  title: 'Container/PeerArticle'
} as Meta

export const ById = {
  args: {
    onQuery: action('onQuery'),
    articleId: article.id,
    peerId: peer.id
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PeerDocument,
            variables: {
              id: peer.id
            }
          },
          result: {
            data: {
              peer
            }
          }
        },
        {
          request: {
            query: PeerArticleDocument,
            variables: {
              articleId: article.id,
              peerId: peer.id
            }
          },
          result: {
            data: {
              peerArticle: article
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
    articleId: article.id,
    peerSlug: peer.slug
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PeerDocument,
            variables: {
              slug: peer.slug
            }
          },
          result: {
            data: {
              peer
            }
          }
        },
        {
          request: {
            query: PeerArticleDocument,
            variables: {
              articleId: article.id,
              peerSlug: peer.slug
            }
          },
          result: {
            data: {
              peerArticle: article
            }
          }
        }
      ]
    }
  }
}

export const WithClassName = {
  ...ById,
  args: {
    ...ById.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  ...ById,
  args: {
    ...ById.args,
    css: css`
      background-color: #eee;
    `
  }
}
