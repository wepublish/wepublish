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

import {
  ArticlesArguments,
  PeersArguments,
  PeerArguments,
  AdapterNavigationLinkType,
  AdapterPageNavigationLink,
  AdapterArticleNavigationLink
} from '../adapter'
import {GraphQLPage} from './page'

export const GraphQLBaseNavigationLink = new GraphQLInterfaceType({
  name: 'BaseNavigationLink',
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPageNavigationLink = new GraphQLObjectType<AdapterPageNavigationLink, Context>({
  name: 'PageNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    page: {
      type: GraphQLPage,
      resolve({pageID}, _args, {adapter}) {
        return adapter.getPage(pageID)
      }
    }
  },
  isTypeOf(value) {
    return value.type === AdapterNavigationLinkType.Page
  }
})

export const GraphQLArticleNavigationLink = new GraphQLObjectType<
  AdapterArticleNavigationLink,
  Context
>({
  name: 'ArticleNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    article: {
      type: GraphQLArticle,
      resolve({articleID}, _args, {adapter}) {
        return adapter.getArticle(articleID)
      }
    }
  },
  isTypeOf(value) {
    return value.type === AdapterNavigationLinkType.Article
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
    return value.type === AdapterNavigationLinkType.External
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
      async resolve(_root, {key}, {adapter}) {
        return await adapter.getNavigation(key)
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
      resolve(_root, {id}, {adapter}) {
        return adapter.getArticle(id)
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
      resolve(_root, {id}, {adapter}) {
        return adapter.getPage(id)
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
      resolve(_root, {slug}, {adapter}) {
        return adapter.getPageBySlug(slug)
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

        console.log(JSON.stringify(graphQLFields(info, {}, {processArguments: true})))

        if (includePeers) {
          // TODO: Fetch peers aswell
          // const peers = await context.adapter.getPeers({})
          // const peerArticles: any[] = []
          // for (const peer of peers) {
          // const result = await queryArticles(peer.url)
          // peerArticles.push(...result.data.nodes.map((article: any) => ({...article, peer})))
          // }
        }

        const articles = context.adapter.getArticles(args as ArticlesArguments)

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

    peer: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {
        id: {
          description: 'ID of the peer.',
          type: GraphQLNonNull(GraphQLString)
        }
      },
      resolve(_root, args: PeerArguments, context: Context) {
        return context.adapter.getPeer(args)
      }
    },
    peers: {
      type: GraphQLNonNull(GraphQLPeerConnection),
      resolve(_root, args: PeersArguments, context: Context) {
        return context.adapter.getPeers(args)
      }
    }
  }
})

export default GraphQLQuery
