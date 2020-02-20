import {GraphQLObjectType, GraphQLList, GraphQLNonNull, GraphQLString, GraphQLInt} from 'graphql'
import {Context} from '../context'
import {GraphQLUser, GraphQLSession} from './session'
import {GraphQLArticleConnection} from './article'
import {UserInputError} from 'apollo-server'

export const GraphQLQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    // Session
    // =======

    sessions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSession))),
      resolve(root, args, {authenticate, dbAdapter}) {
        const session = authenticate()
        return dbAdapter.getSessionsForUser(session.user)
      }
    },

    // User
    // ====

    me: {
      type: GraphQLUser,
      resolve(root, args, {authenticate}) {
        return authenticate().user
      }
    },

    // Article
    // =======

    articles: {
      type: GraphQLNonNull(GraphQLArticleConnection),
      args: {
        after: {type: GraphQLString},
        before: {type: GraphQLString},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt}
      },
      resolve(root, {after, before, first, last}, {authenticate, dbAdapter}) {
        authenticate()
        return dbAdapter.getArticles({after, before, first, last})
      }
    },

    publishedArticles: {
      type: GraphQLNonNull(GraphQLArticleConnection),
      args: {
        after: {type: GraphQLString},
        before: {type: GraphQLString},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt}
      },
      resolve(root, {after, before, first, last}, {dbAdapter}) {
        if ((first == null && last == null) || (first != null && last != null)) {
          throw new UserInputError('You must provide either `first` or `last`.')
        }

        return dbAdapter.getPublishedArticles({after, before, first, last})
      }
    }
  }
})

// import {
//   GraphQLObjectType,
//   GraphQLString,
//   GraphQLList,
//   GraphQLNonNull,
//   GraphQLInt,
//   GraphQLBoolean,
//   GraphQLUnionType,
//   GraphQLInterfaceType,
//   GraphQLID
// } from 'graphql'

// import {GraphQLDateRangeInput} from './dateRange'
// import {GraphQLArticle, GraphQLArticleConnection} from './article'
// import {GraphQLPeer, GraphQLPeerConnection} from './peer'

// import {Context} from '../context'
// import {GraphQLPage, GraphQLPageConnection} from './page'
// import {PageNavigationLink, NavigationLinkType, ArticleNavigationLink} from '../adapter/navigation'
// import {ArticlesArguments} from '../adapter/article'
// import {PeerArguments, PeersArguments} from '../adapter/peer'
// import {GraphQLImageConnection, GraphQLImage} from './image'
// import {GraphQLUser} from './session'
// import {UserInputError} from 'apollo-server'
// import {GraphQLAuthorConnection, GraphQLAuthor} from './author'

// export const GraphQLBaseNavigationLink = new GraphQLInterfaceType({
//   name: 'BaseNavigationLink',
//   fields: {
//     label: {type: GraphQLNonNull(GraphQLString)}
//   }
// })

// export const GraphQLPageNavigationLink = new GraphQLObjectType<PageNavigationLink, Context>({
//   name: 'PageNavigationLink',
//   interfaces: [GraphQLBaseNavigationLink],
//   fields: {
//     label: {type: GraphQLNonNull(GraphQLString)},
//     page: {
//       type: GraphQLPage,
//       resolve({pageID}, _args, {storageAdapter}) {
//         return storageAdapter.getPage(pageID)
//       }
//     }
//   },
//   isTypeOf(value) {
//     return value.type === NavigationLinkType.Page
//   }
// })

// export const GraphQLArticleNavigationLink = new GraphQLObjectType<ArticleNavigationLink, Context>({
//   name: 'ArticleNavigationLink',
//   interfaces: [GraphQLBaseNavigationLink],
//   fields: {
//     label: {type: GraphQLNonNull(GraphQLString)},
//     article: {
//       type: GraphQLArticle,
//       resolve({articleID}, _args, {storageAdapter}) {
//         return storageAdapter.getArticle(articleID)
//       }
//     }
//   },
//   isTypeOf(value) {
//     return value.type === NavigationLinkType.Article
//   }
// })

// export const GraphQLExternalNavigationLink = new GraphQLObjectType({
//   name: 'ExternalNavigationLink',
//   interfaces: [GraphQLBaseNavigationLink],
//   fields: {
//     label: {type: GraphQLNonNull(GraphQLString)},
//     url: {type: GraphQLNonNull(GraphQLString)}
//   },
//   isTypeOf(value) {
//     return value.type === NavigationLinkType.External
//   }
// })

// export const GraphQLNavigationLink = new GraphQLUnionType({
//   name: 'NavigationLink',
//   types: [GraphQLPageNavigationLink, GraphQLArticleNavigationLink, GraphQLExternalNavigationLink]
// })

// export const GraphQLNavigation = new GraphQLObjectType({
//   name: 'Navigation',
//   fields: {
//     key: {type: GraphQLNonNull(GraphQLString)},
//     name: {type: GraphQLNonNull(GraphQLString)},
//     links: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLNavigationLink)))}
//   }
// })

// export const GraphQLQuery = new GraphQLObjectType<any, Context>({
//   name: 'Query',
//   fields: {
//     // User
//     // ====

//     me: {
//       type: GraphQLUser,
//       resolve(root, {}, {authenticate, storageAdapter}) {
//         return authenticate()
//       }
//     },

//     // Navigation
//     // ==========

//     navigation: {
//       type: GraphQLNavigation,
//       args: {key: {type: GraphQLNonNull(GraphQLString)}},
//       resolve(root, {key}, {storageAdapter}) {
//         return storageAdapter.getNavigation(key)
//       }
//     },

//     // Article
//     // =======

//     article: {
//       type: GraphQLArticle,
//       args: {
//         id: {
//           description: 'ID of the Article.',
//           type: GraphQLNonNull(GraphQLID)
//         }
//       },
//       resolve(_root, {id}, {storageAdapter}) {
//         return storageAdapter.getArticle(id)
//       }
//     },

//     articles: {
//       type: GraphQLNonNull(GraphQLArticleConnection),
//       description: 'Request articles based on a date range.',

//       args: {
//         filter: {type: GraphQLString},

//         limit: {
//           type: GraphQLInt,
//           description:
//             'Limit the number of articles being returned. ' +
//             "Note that there's no way to paginate to the remaining articles, " +
//             '`limit` should only be used when you need to request a fixed number of articles.'
//         },

//         publishedBetween: {
//           type: GraphQLDateRangeInput,
//           description:
//             'Get articles published between a date range. ' +
//             'Mutally exclusive with `updatedBetween` and `createdBetween`'
//         },

//         updatedBetween: {
//           type: GraphQLDateRangeInput,
//           description:
//             'Get articles updated between a date range. ' +
//             'Mutally exclusive with `publishedBetween` and `createdBetween`'
//         },

//         createdBetween: {
//           type: GraphQLDateRangeInput,
//           description:
//             'Get articles created between a date range. ' +
//             'Mutally exclusive with `updatedBetween` and `publishedBetween`'
//         },

//         tagsInclude: {
//           description: 'A list of tags to match against the article.',
//           type: GraphQLList(GraphQLString)
//         },

//         includePeers: {
//           description: 'Should articles of peers also be fetched.',
//           type: GraphQLBoolean,
//           defaultValue: true
//         }
//       },
//       async resolve(_root, args, context) {
//         const {filter, publishedBetween, createdBetween, updatedBetween} = args

//         if (
//           (publishedBetween && createdBetween && updatedBetween) ||
//           (publishedBetween && createdBetween) ||
//           (publishedBetween && updatedBetween) ||
//           (createdBetween && updatedBetween)
//         ) {
//           throw new Error(
//             '`publishedBetween`, `createdBetween` and `updatedBetween` are mutally exclusive.'
//           )
//         }

//         const articles = context.storageAdapter.getArticles(filter, args as ArticlesArguments)

//         return {
//           nodes: articles,
//           pageInfo: {
//             publishedBetween,
//             createdBetween,
//             updatedBetween
//           }
//         }
//       }
//     },

//     // Page
//     // ====

//     page: {
//       type: GraphQLPage,
//       args: {
//         id: {
//           description: 'ID of the Page.',
//           type: GraphQLID
//         },
//         slug: {
//           description: 'Slug of the Page.',
//           type: GraphQLString
//         }
//       },
//       resolve(_root, {id, slug}, {storageAdapter}) {
//         return storageAdapter.getPage(id, slug)
//       }
//     },

//     pages: {
//       type: GraphQLNonNull(GraphQLPageConnection),
//       args: {
//         filter: {type: GraphQLString}
//       },
//       async resolve(_root, {filter}, context: Context, info) {
//         return {
//           nodes: await context.storageAdapter.getPages(filter)
//         }
//       }
//     },

//     // Image
//     // =====

//     image: {
//       type: GraphQLImage,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)}
//       },
//       async resolve(root, {id}, {loaders}) {
//         return loaders.image.load(id)
//       }
//     },

//     images: {
//       type: GraphQLNonNull(GraphQLImageConnection),
//       args: {
//         filter: {type: GraphQLString},
//         after: {type: GraphQLString},
//         before: {type: GraphQLString},
//         first: {type: GraphQLInt},
//         last: {type: GraphQLInt}
//       },
//       async resolve(_root, {filter, after, before, first, last}, {storageAdapter}) {
//         if ((first == null && last == null) || (first != null && last != null)) {
//           throw new UserInputError('You must provide either `first` or `last`.')
//         }

//         const decodedAfter = after && Buffer.from(after, 'base64').toString()
//         const decodedBefore = before && Buffer.from(before, 'base64').toString()

//         const result = await storageAdapter.getImages(filter, {
//           after: decodedAfter,
//           before: decodedBefore,
//           first,
//           last
//         })

//         const [nodes, {startCursor, endCursor, hasNextPage, hasPreviousPage}, totalCount] = result

//         const encodedStartCursor = startCursor && Buffer.from(startCursor).toString('base64')
//         const encodedEndCursor = endCursor && Buffer.from(endCursor).toString('base64')

//         return {
//           nodes,
//           totalCount,
//           pageInfo: {
//             startCursor: encodedStartCursor,
//             endCursor: encodedEndCursor,
//             hasNextPage,
//             hasPreviousPage
//           }
//         }
//       }
//     },

//     // Author
//     // ======

//     author: {
//       type: GraphQLAuthor,
//       args: {
//         id: {
//           description: 'ID of the author.',
//           type: GraphQLNonNull(GraphQLID)
//         }
//       },
//       resolve(_root, {id}, context) {
//         return context.storageAdapter.getAuthor(id)
//       }
//     },

//     authors: {
//       type: GraphQLNonNull(GraphQLAuthorConnection),
//       args: {
//         filter: {type: GraphQLString},
//         after: {type: GraphQLString},
//         before: {type: GraphQLString},
//         first: {type: GraphQLInt},
//         last: {type: GraphQLInt}
//       },
//       async resolve(_root, {filter, after, before, first, last}, {storageAdapter}) {
//         if ((first == null && last == null) || (first != null && last != null)) {
//           throw new UserInputError('You must provide either `first` or `last`.')
//         }

//         const decodedAfter = after && Buffer.from(after, 'base64').toString()
//         const decodedBefore = before && Buffer.from(before, 'base64').toString()

//         const result = await storageAdapter.getAuthors(filter, {
//           after: decodedAfter,
//           before: decodedBefore,
//           first,
//           last
//         })

//         const [nodes, {startCursor, endCursor, hasNextPage, hasPreviousPage}, totalCount] = result

//         const encodedStartCursor = startCursor && Buffer.from(startCursor).toString('base64')
//         const encodedEndCursor = endCursor && Buffer.from(endCursor).toString('base64')

//         return {
//           nodes,
//           totalCount,
//           pageInfo: {
//             startCursor: encodedStartCursor,
//             endCursor: encodedEndCursor,
//             hasNextPage,
//             hasPreviousPage
//           }
//         }
//       }
//     },

//     // Peer
//     // ====

//     peer: {
//       type: GraphQLNonNull(GraphQLPeer),
//       args: {
//         id: {
//           description: 'ID of the peer.',
//           type: GraphQLNonNull(GraphQLString)
//         }
//       },
//       resolve(_root, args: PeerArguments, context: Context) {
//         return context.storageAdapter.getPeer(args)
//       }
//     },

//     peers: {
//       type: GraphQLNonNull(GraphQLPeerConnection),
//       resolve(_root, args: PeersArguments, context: Context) {
//         return context.storageAdapter.getPeers(args)
//       }
//     }
//   }
// })
