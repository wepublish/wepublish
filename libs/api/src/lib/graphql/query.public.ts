import {AuthSessionType} from '@wepublish/authentication/api'
import {SortOrder, logger} from '@wepublish/utils/api'
import {UserInputError} from 'apollo-server-express'
import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {Context} from '../context'
import {ArticleSort} from '../db/article'
import {AuthorSort} from '../db/author'
import {MemberPlanSort} from '../db/memberPlan'
import {PageSort, PublicPage} from '../db/page'
import {NotFound} from '../error'
import {delegateToPeerSchema} from '../utility'
import {
  GraphQLPublicArticle,
  GraphQLPublicArticleConnection,
  GraphQLPublicArticleFilter,
  GraphQLPublicArticleSort
} from './article'
import {getPublishedArticleByIdOrSlug, getPublishedArticles} from './article/article.public-queries'
import {GraphQLAuthProvider} from './auth'
import {
  GraphQLAuthor,
  GraphQLAuthorConnection,
  GraphQLAuthorFilter,
  GraphQLAuthorSort
} from './author'
import {getPublicAuthors} from './author/author.public-queries'
import {GraphQLChallenge} from './challenge'
import {GraphQLFullCommentRatingSystem} from './comment-rating/comment-rating'
import {getRatingSystem} from './comment-rating/comment-rating.public-queries'
import {GraphQLPublicComment, GraphQLPublicCommentSort} from './comment/comment'
import {getPublicCommentsForItemById} from './comment/comment.public-queries'
import {GraphQLSortOrder} from './common'

import {GraphQLPublicInvoice} from './invoice'
import {getPublicInvoices} from './invoice/invoice.public-queries'
import {getActiveMemberPlans} from './member-plan/member-plan.public-queries'
import {
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort,
  GraphQLPublicMemberPlan,
  GraphQLPublicMemberPlanConnection
} from './memberPlan'
import {GraphQLPublicNavigation} from './navigation'
import {getNavigations} from './navigation/navigation.public-queries'
import {
  GraphQLPublicPage,
  GraphQLPublicPageConnection,
  GraphQLPublishedPageFilter,
  GraphQLPublishedPageSort
} from './page'
import {getPublishedPages} from './page/page.public-queries'
import {GraphQLPeer, GraphQLPeerProfile} from './peer'
import {getPublicPeerProfile} from './peer-profile/peer-profile.public-queries'
import {getPeerByIdOrSlug} from './peer/peer.public-queries'
import {GraphQLPublicPhrase} from './phrase/phrase'
import {queryPhrase} from './phrase/phrase.public-queries'
import {GraphQLFullPoll} from './poll/poll'
import {getPoll, userPollVote} from './poll/poll.public-queries'
import {GraphQLSlug} from '@wepublish/utils/api'
import {GraphQLPublicSubscription} from './subscription-public'
import {GraphQLTagConnection, GraphQLTagFilter, GraphQLTagSort} from './tag/tag'
import {TagSort, getTags} from './tag/tag.query'
import {GraphQLPublicUser} from './user'
import {
  GraphQLEvent,
  GraphQLEventConnection,
  GraphQLEventFilter,
  GraphQLEventSort
} from './event/event'
import {EventSort, getEvent, getEvents} from './event/event.query'

export const GraphQLPublicQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    peerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      description: 'This query returns the peer profile.',
      resolve: (root, args, {hostURL, websiteURL, prisma: {peerProfile}}) =>
        getPublicPeerProfile(hostURL, websiteURL, peerProfile)
    },

    peer: {
      type: GraphQLPeer,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      description: 'This query takes either the ID or the slug and returns the peer profile.',
      resolve: (root, {id, slug}, {loaders: {peer, peerBySlug}}) =>
        getPeerByIdOrSlug(id, slug, peer, peerBySlug)
    },

    // Navigation
    // ==========

    navigation: {
      type: GraphQLPublicNavigation,
      args: {id: {type: GraphQLID}, key: {type: GraphQLID}},
      description: 'This query takes either the ID or the key and returns the navigation.',
      resolve(root, {id, key}, {loaders}) {
        if ((id == null && key == null) || (id != null && key != null)) {
          throw new UserInputError('You must provide either `id` or `key`.')
        }

        return id ? loaders.navigationByID.load(id) : loaders.navigationByKey.load(key)
      }
    },

    navigations: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLPublicNavigation)),
      description: 'This query returns all navigations.',
      resolve: (root, _, {prisma: {navigation}}) => getNavigations(navigation)
    },

    // Author
    // ======

    author: {
      type: GraphQLAuthor,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      description: 'This query takes either the ID or the slug and returns the author.',
      resolve(root, {id, slug}, {authenticateUser, loaders}) {
        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id ? loaders.authorsByID.load(id) : loaders.authorsBySlug.load(slug)
      }
    },

    authors: {
      type: new GraphQLNonNull(GraphQLAuthorConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLAuthorFilter},
        sort: {type: GraphQLAuthorSort, defaultValue: AuthorSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query is to get the authors.',
      resolve: (root, {filter, sort, order, take, skip, cursor}, {prisma: {author}}) =>
        getPublicAuthors(filter, sort, order, cursor, skip, take, author)
    },

    // Article
    // =======

    article: {
      type: GraphQLPublicArticle,
      args: {
        id: {type: GraphQLID},
        slug: {type: GraphQLSlug},
        token: {type: GraphQLString}
      },
      description: 'This query takes either the ID, slug or token and returns the article.',
      resolve: (
        root,
        {id, slug, token},
        {session, loaders: {articles, publicArticles}, prisma: {article}, verifyJWT}
      ) =>
        getPublishedArticleByIdOrSlug(
          id,
          slug,
          token,
          session,
          verifyJWT,
          publicArticles,
          articles,
          article
        )
    },

    articles: {
      type: new GraphQLNonNull(GraphQLPublicArticleConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLPublicArticleFilter},
        sort: {type: GraphQLPublicArticleSort, defaultValue: ArticleSort.PublishedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query returns the articles.',
      resolve: (root, {filter, sort, order, skip, take, cursor}, {prisma: {article}}) =>
        getPublishedArticles(filter, sort, order, cursor, skip, take, article)
    },

    // Peer Article
    // ============

    peerArticle: {
      type: GraphQLPublicArticle,
      args: {
        peerID: {type: GraphQLID},
        peerSlug: {type: GraphQLSlug},
        id: {type: new GraphQLNonNull(GraphQLID)}
      },
      description: 'This query takes either the peer ID or the peer slug and returns the article.',
      async resolve(root, {peerID, peerSlug, id}, context, info) {
        const {loaders} = context

        if ((peerID == null && peerSlug == null) || (peerID != null && peerSlug != null)) {
          throw new UserInputError('You must provide either `peerID` or `peerSlug`.')
        }

        if (peerSlug) {
          const peer = await loaders.peerBySlug.load(peerSlug)

          if (peer) {
            peerID = peer.id
            loaders.peer.prime(peer.id, peer)
          }
        }

        if (!peerID) return null

        return delegateToPeerSchema(peerID, false, context, {
          fieldName: 'article',
          args: {id},
          info
        })
      }
    },

    // Page
    // =======

    page: {
      type: GraphQLPublicPage,
      args: {
        id: {type: GraphQLID},
        slug: {type: GraphQLSlug},
        token: {type: GraphQLString}
      },
      description: 'This query takes either the ID, slug or token and returns the page.',
      async resolve(root, {id, slug, token}, {session, loaders, verifyJWT}) {
        let page = id ? await loaders.publicPagesByID.load(id) : null

        if (!page && slug !== undefined) {
          // slug can be empty string
          page = await loaders.publicPagesBySlug.load(slug)
        }

        if (!page && token) {
          try {
            const pageId = verifyJWT(token)
            const privatePage = await loaders.pages.load(pageId)

            page = privatePage?.draft
              ? ({
                  ...privatePage.draft,
                  id: privatePage.id,
                  updatedAt: new Date(),
                  publishedAt: new Date()
                } as PublicPage)
              : null
          } catch (error) {
            logger('graphql-query').warn(
              error as Error,
              'Error while verifying token with page id.'
            )
          }
        }
        if (!page) throw new NotFound('Page', id ?? slug ?? token)

        return page
      }
    },

    pages: {
      type: new GraphQLNonNull(GraphQLPublicPageConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLPublishedPageFilter},
        sort: {type: GraphQLPublishedPageSort, defaultValue: PageSort.PublishedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query returns the pages.',
      resolve: (root, {filter, sort, order, cursor, take, skip}, {prisma: {page}}) =>
        getPublishedPages(filter, sort, order, cursor, skip, take, page)
    },

    // Comments
    // =======

    comments: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicComment))),
      args: {
        itemId: {type: new GraphQLNonNull(GraphQLID)},
        sort: {type: GraphQLPublicCommentSort},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query returns the comments of an item.',
      resolve: (
        root,
        {itemId, sort, order},
        {session, prisma: {comment}, loaders: {commentRatingSystemAnswers}}
      ) => {
        const userId = session?.type === AuthSessionType.User ? session.user.id : null

        return getPublicCommentsForItemById(
          itemId,
          userId,
          sort,
          order,
          commentRatingSystemAnswers,
          comment
        )
      }
    },

    // Auth
    // =======

    authProviders: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLAuthProvider))),
      args: {redirectUri: {type: GraphQLString}},
      description: 'This query returns the redirect Uri.',
      async resolve(root, {redirectUri}, {getOauth2Clients}) {
        const clients = await getOauth2Clients()
        return clients.map(client => {
          const url = client.client.authorizationUrl({
            scope: client.provider.scopes.join(),
            response_mode: 'query',
            redirect_uri: `${redirectUri}/${client.name}`,
            state: 'fakeRandomString'
          })
          return {
            name: client.name,
            url
          }
        })
      }
    },

    // User
    // ====

    me: {
      type: GraphQLPublicUser,
      description: 'This query returns the user.',
      resolve(root, args, {session}) {
        return session?.type === AuthSessionType.User ? session.user : null
      }
    },

    invoices: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicInvoice))),
      description: 'This query returns the invoices  of the authenticated user.',
      resolve: (root, _, {authenticateUser, prisma: {subscription, invoice}}) =>
        getPublicInvoices(authenticateUser, subscription, invoice)
    },

    subscriptions: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicSubscription))),
      description: 'This query returns the subscriptions of the authenticated user.',
      async resolve(root, _, {authenticateUser, prisma}) {
        const {user} = authenticateUser()

        return await prisma.subscription.findMany({
          where: {
            userID: user.id
          },
          include: {
            deactivation: true,
            periods: true,
            properties: true
          }
        })
      }
    },

    memberPlan: {
      type: GraphQLPublicMemberPlan,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      description: 'This query returns a member plan.',
      resolve(root, {id, slug}, {loaders}) {
        if ((!id && !slug) || (id && slug)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id
          ? loaders.activeMemberPlansByID.load(id)
          : loaders.activeMemberPlansBySlug.load(slug)
      }
    },

    memberPlans: {
      type: new GraphQLNonNull(GraphQLPublicMemberPlanConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLMemberPlanFilter},
        sort: {type: GraphQLMemberPlanSort, defaultValue: MemberPlanSort.CreatedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query returns the member plans.',
      resolve: (root, {filter, sort, order, take, skip, cursor}, {prisma: {memberPlan}}) =>
        getActiveMemberPlans(filter, sort, order, cursor, skip, take, memberPlan)
    },

    checkInvoiceStatus: {
      type: GraphQLPublicInvoice,
      args: {
        id: {type: new GraphQLNonNull(GraphQLID)}
      },
      description:
        'This mutation will check the invoice status and update with information from the paymentProvider',
      async resolve(root, {id}, context) {
        const {authenticateUser, prisma, paymentProviders} = context
        const {user} = authenticateUser()

        const invoice = await prisma.invoice.findUnique({
          where: {
            id
          },
          include: {
            items: true
          }
        })

        if (!invoice || !invoice.subscriptionID) {
          throw new NotFound('Invoice', id)
        }

        const subscription = await prisma.subscription.findUnique({
          where: {
            id: invoice.subscriptionID
          }
        })

        if (!subscription || subscription.userID !== user.id) {
          throw new NotFound('Invoice', id)
        }

        const payments = await prisma.payment.findMany({
          where: {
            invoiceID: invoice.id
          }
        })
        const paymentMethods = await prisma.paymentMethod.findMany({
          where: {
            active: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        for (const payment of payments) {
          if (!payment || !payment.intentID) continue

          const paymentMethod = paymentMethods.find(pm => pm.id === payment.paymentMethodID)
          if (!paymentMethod) continue // TODO: what happens if we don't find a paymentMethod

          const paymentProvider = paymentProviders.find(
            pp => pp.id === paymentMethod.paymentProviderID
          )
          if (!paymentProvider) continue // TODO: what happens if we don't find a paymentProvider

          const intentState = await paymentProvider.checkIntentStatus({
            intentID: payment.intentID,
            paymentID: payment.id
          })
          await paymentProvider.updatePaymentWithIntentState({
            intentState,
            paymentClient: context.prisma.payment,
            paymentsByID: context.loaders.paymentsByID,
            invoicesByID: context.loaders.invoicesByID,
            subscriptionClient: prisma.subscription,
            userClient: prisma.user,
            invoiceClient: context.prisma.invoice,
            subscriptionPeriodClient: context.prisma.subscriptionPeriod,
            invoiceItemClient: context.prisma.invoiceItem
          })
        }

        // FIXME: We need to implement a way to wait for all the database
        //  event hooks to finish before we return data. Will be solved in WPC-498
        await new Promise(resolve => setTimeout(resolve, 100))

        return await prisma.invoice.findUnique({
          where: {
            id
          },
          include: {
            items: true
          }
        })
      }
    },

    // Challenge
    // =======
    challenge: {
      type: new GraphQLNonNull(GraphQLChallenge),
      description:
        'This query generates a challenge which can be used to access protected endpoints.',
      async resolve(_, {input}, {challenge}) {
        const c = await challenge.generateChallenge()
        return {
          type: c.type,
          challenge: c.challenge,
          challengeID: c.challengeID,
          validUntil: c.validUntil
        }
      }
    },

    // Rating System
    // ==========

    ratingSystem: {
      type: new GraphQLNonNull(GraphQLFullCommentRatingSystem),
      resolve: (root, input, {prisma: {commentRatingSystem}}) =>
        getRatingSystem(commentRatingSystem)
    },

    // Poll
    // =======
    poll: {
      type: new GraphQLNonNull(GraphQLFullPoll),
      description: 'This query returns a poll with all the needed data',
      args: {
        id: {type: new GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {prisma: {poll}}) => getPoll(id, poll)
    },

    userPollVote: {
      type: GraphQLID,
      description: 'This query returns the answerId of a poll if the user has already voted on it.',
      args: {
        pollId: {type: new GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {pollId}, {authenticateUser, prisma: {pollVote}}) =>
        userPollVote(pollId, authenticateUser, pollVote)
    },

    // Event
    // =======
    events: {
      type: GraphQLEventConnection,
      description: 'This query returns a list of events',
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLEventFilter},
        sort: {type: GraphQLEventSort, defaultValue: EventSort.StartsAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {cursor, take, skip, filter, sort, order}, {prisma: {event}}) =>
        getEvents(filter, sort, order, cursor, skip, take, event)
    },

    event: {
      type: new GraphQLNonNull(GraphQLEvent),
      description: 'This query returns an event',
      args: {
        id: {type: new GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {prisma: {event}}) => getEvent(id, event)
    },

    // Tag
    // ==========

    tags: {
      type: GraphQLTagConnection,
      description: 'This query returns a list of tags',
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLTagFilter},
        sort: {type: GraphQLTagSort, defaultValue: TagSort.CreatedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {filter, sort, order, cursor, take, skip}, {prisma}) =>
        getTags(filter, sort, order, cursor, skip, take, prisma.tag)
    },

    // Phrase
    // =======

    phrase: {
      type: GraphQLPublicPhrase,
      description:
        'This query performs a fulltext search on titles and blocks of articles/pages and returns all matching ones.',
      args: {
        query: {type: new GraphQLNonNull(GraphQLString)},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        pageSort: {type: GraphQLPublishedPageSort, defaultValue: PageSort.PublishedAt},
        articleSort: {type: GraphQLPublicArticleSort, defaultValue: ArticleSort.PublishedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {query, take, skip, pageSort, articleSort, order}, {prisma, loaders}) =>
        queryPhrase(
          query,
          prisma,
          loaders.publicArticles,
          loaders.publicPagesByID,
          take,
          skip,
          pageSort,
          articleSort,
          order
        )
    }
  }
})
