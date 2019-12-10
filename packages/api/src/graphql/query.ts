import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLUnionType,
  GraphQLInterfaceType,
  GraphQLID
} from 'graphql'

import {GraphQLDateRangeInput} from './dateRange'
import {GraphQLArticle, GraphQLArticleConnection} from './article'
import {GraphQLPeer, GraphQLPeerConnection} from './peer'

import {Context} from '../context'
import {GraphQLPage, GraphQLPageConnection} from './page'
import {PageNavigationLink, NavigationLinkType, ArticleNavigationLink} from '../adapter/navigation'
import {ArticlesArguments} from '../adapter/article'
import {PeerArguments, PeersArguments} from '../adapter/peer'
import {GraphQLImageConnection, GraphQLImage} from './image'
import {GraphQLUser} from './session'
import {UserInputError} from 'apollo-server'

export const GraphQLBaseNavigationLink = new GraphQLInterfaceType({
  name: 'BaseNavigationLink',
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPageNavigationLink = new GraphQLObjectType<PageNavigationLink, Context>({
  name: 'PageNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    page: {
      type: GraphQLPage,
      resolve({pageID}, _args, {storageAdapter}) {
        return storageAdapter.getPage(pageID)
      }
    }
  },
  isTypeOf(value) {
    return value.type === NavigationLinkType.Page
  }
})

export const GraphQLArticleNavigationLink = new GraphQLObjectType<ArticleNavigationLink, Context>({
  name: 'ArticleNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    article: {
      type: GraphQLArticle,
      resolve({articleID}, _args, {storageAdapter}) {
        return storageAdapter.getArticle(articleID)
      }
    }
  },
  isTypeOf(value) {
    return value.type === NavigationLinkType.Article
  }
})

export const GraphQLExternalNavigationLink = new GraphQLObjectType({
  name: 'ExternalNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    url: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === NavigationLinkType.External
  }
})

export const GraphQLNavigationLink = new GraphQLUnionType({
  name: 'NavigationLink',
  types: [GraphQLPageNavigationLink, GraphQLArticleNavigationLink, GraphQLExternalNavigationLink]
})

export const GraphQLNavigation = new GraphQLObjectType({
  name: 'Navigation',
  fields: {
    key: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    links: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLNavigationLink)))}
  }
})

export const GraphQLQuery = new GraphQLObjectType<any, Context>({
  name: 'Query',
  fields: {
    // User
    // ====

    me: {
      type: GraphQLUser,
      resolve(root, {}, {authenticate, storageAdapter}) {
        return authenticate()
      }
    },

    // Navigation
    // ==========

    navigation: {
      type: GraphQLNavigation,
      args: {key: {type: GraphQLNonNull(GraphQLString)}},
      resolve(root, {key}, {storageAdapter}) {
        return storageAdapter.getNavigation(key)
      }
    },

    // Article
    // =======

    article: {
      type: GraphQLArticle,
      args: {
        id: {
          description: 'ID of the Article.',
          type: GraphQLNonNull(GraphQLID)
        }
      },
      resolve(_root, {id}, {storageAdapter}) {
        return storageAdapter.getArticle(id)
      }
    },

    articles: {
      type: GraphQLNonNull(GraphQLArticleConnection),
      description: 'Request articles based on a date range.',

      args: {
        limit: {
          type: GraphQLInt,
          description:
            'Limit the number of articles being returned. ' +
            "Note that there's no way to paginate to the remaining articles, " +
            '`limit` should only be used when you need to request a fixed number of articles.'
        },

        publishedBetween: {
          type: GraphQLDateRangeInput,
          description:
            'Get articles published between a date range. ' +
            'Mutally exclusive with `updatedBetween` and `createdBetween`'
        },

        updatedBetween: {
          type: GraphQLDateRangeInput,
          description:
            'Get articles updated between a date range. ' +
            'Mutally exclusive with `publishedBetween` and `createdBetween`'
        },

        createdBetween: {
          type: GraphQLDateRangeInput,
          description:
            'Get articles created between a date range. ' +
            'Mutally exclusive with `updatedBetween` and `publishedBetween`'
        },

        tagsInclude: {
          description: 'A list of tags to match against the article.',
          type: GraphQLList(GraphQLString)
        },

        includePeers: {
          description: 'Should articles of peers also be fetched.',
          type: GraphQLBoolean,
          defaultValue: true
        }
      },
      async resolve(_root, args, context: Context, info) {
        const {publishedBetween, createdBetween, updatedBetween} = args

        if (
          (publishedBetween && createdBetween && updatedBetween) ||
          (publishedBetween && createdBetween) ||
          (publishedBetween && updatedBetween) ||
          (createdBetween && updatedBetween)
        ) {
          throw new Error(
            '`publishedBetween`, `createdBetween` and `updatedBetween` are mutally exclusive.'
          )
        }

        const articles = context.storageAdapter.getArticles(args as ArticlesArguments)

        return {
          nodes: articles,
          pageInfo: {
            publishedBetween,
            createdBetween,
            updatedBetween
          }
        }
      }
    },

    // Page
    // ====

    page: {
      type: GraphQLPage,
      args: {
        id: {
          description: 'ID of the Page.',
          type: GraphQLID
        },
        slug: {
          description: 'Slug of the Page.',
          type: GraphQLString
        }
      },
      resolve(_root, {id, slug}, {storageAdapter}) {
        return storageAdapter.getPage(id, slug)
      }
    },

    pages: {
      type: GraphQLNonNull(GraphQLPageConnection),
      async resolve(_root, args, context: Context, info) {
        return {
          nodes: await context.storageAdapter.getPages()
        }
      }
    },

    // Image
    // =====

    image: {
      type: GraphQLImage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {storageAdapter}) {
        return storageAdapter.getImage(id)
      }
    },

    images: {
      type: GraphQLNonNull(GraphQLImageConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt}
      },
      async resolve(_root, {after, before, first, last}, {storageAdapter}) {
        if ((first == null && last == null) || (first != null && last != null)) {
          throw new UserInputError('You must provide either `first` or `last`.')
        }

        const decodedAfter = after && Buffer.from(after, 'base64').toString()
        const decodedBefore = before && Buffer.from(before, 'base64').toString()

        const result = await storageAdapter.getImages({
          after: decodedAfter,
          before: decodedBefore,
          first,
          last
        })

        const [nodes, {startCursor, endCursor, hasNextPage, hasPreviousPage}, totalCount] = result

        const encodedStartCursor = startCursor && Buffer.from(startCursor).toString('base64')
        const encodedEndCursor = endCursor && Buffer.from(endCursor).toString('base64')

        return {
          nodes,
          totalCount,
          pageInfo: {
            startCursor: encodedStartCursor,
            endCursor: encodedEndCursor,
            hasNextPage,
            hasPreviousPage
          }
        }
      }
    },

    // Peer
    // ====

    peer: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {
        id: {
          description: 'ID of the peer.',
          type: GraphQLNonNull(GraphQLString)
        }
      },
      resolve(_root, args: PeerArguments, context: Context) {
        return context.storageAdapter.getPeer(args)
      }
    },

    peers: {
      type: GraphQLNonNull(GraphQLPeerConnection),
      resolve(_root, args: PeersArguments, context: Context) {
        return context.storageAdapter.getPeers(args)
      }
    }
  }
})

export default GraphQLQuery
