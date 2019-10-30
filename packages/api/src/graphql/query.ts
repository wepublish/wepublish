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

import graphQLFields from 'graphql-fields'

import {GraphQLDateRangeInput} from './dateRange'
import {GraphQLArticle, GraphQLArticleConnection} from './article'
import {GraphQLPeer, GraphQLPeerConnection} from './peer'

import {Context} from '../context'
import {GraphQLPage} from './page'
import {PageNavigationLink, NavigationLinkType, ArticleNavigationLink} from '../adapter/navigation'
import {ArticlesArguments} from '../adapter/article'
import {PeerArguments, PeersArguments} from '../adapter/peer'
import {GraphQLImageConnection} from './image'

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
  name: 'ArticleExternalLink',
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
  types: [GraphQLPageNavigationLink, GraphQLArticleNavigationLink]
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
    navigation: {
      type: GraphQLNavigation,
      args: {key: {type: GraphQLNonNull(GraphQLString)}},
      async resolve(_root, {key}, {storageAdapter}) {
        return await storageAdapter.getNavigation(key)
      }
    },
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
    page: {
      type: GraphQLPage,
      args: {
        id: {
          description: 'ID of the Page.',
          type: GraphQLString
        }
      },
      resolve(_root, {id}, {storageAdapter}) {
        return storageAdapter.getPage(id)
      }
    },

    pageBySlug: {
      type: GraphQLPage,
      args: {
        slug: {
          description: 'Slug of the Page.',
          type: GraphQLString
        }
      },
      resolve(_root, {slug}, {storageAdapter}) {
        return storageAdapter.getPageBySlug(slug)
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
        const {
          publishedBetween,
          createdBetween,
          updatedBetween,
          includePeers
        } = args as ArticlesArguments

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

        if (includePeers) {
          console.log(JSON.stringify(graphQLFields(info, {}, {processArguments: true})))

          // TODO: Fetch peers aswell
          // const peers = await context.adapter.getPeers({})
          // const peerArticles: any[] = []
          // for (const peer of peers) {
          // const result = await queryArticles(peer.url)
          // peerArticles.push(...result.data.nodes.map((article: any) => ({...article, peer})))
          // }
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

    images: {
      type: GraphQLNonNull(GraphQLImageConnection),
      args: {
        offset: {type: GraphQLNonNull(GraphQLInt)},
        limit: {type: GraphQLNonNull(GraphQLInt)}
      },
      async resolve(_root, {offset, limit}, {storageAdapter}) {
        const [total, nodes] = await storageAdapter.getImages(offset, limit)

        return {
          nodes,
          pageInfo: {
            total,
            offset,
            limit
          }
        }
      }
    },

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
