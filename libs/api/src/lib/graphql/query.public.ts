import {AuthSessionType} from '@wepublish/authentication/api'
import {GraphQLSlug, SortOrder} from '@wepublish/utils/api'
import {UserInputError} from 'apollo-server-express'
import {GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'
import {AuthorSort} from '../db/author'
import {MemberPlanSort} from '../db/memberPlan'
import {NotFound} from '../error'
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
import {GraphQLPeer, GraphQLPeerProfile} from './peer'
import {getPublicPeerProfile} from './peer-profile/peer-profile.public-queries'
import {getPeerByIdOrSlug} from './peer/peer.public-queries'
import {GraphQLFullPoll} from './poll/poll'
import {getPoll, userPollVote} from './poll/poll.public-queries'
import {GraphQLPublicSubscription} from './subscription-public'
import {GraphQLTagConnection, GraphQLTagFilter, GraphQLTagSort} from './tag/tag'
import {getTags, TagSort} from './tag/tag.query'
import {GraphQLPublicUser} from './user'

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
      args: {id: {type: GraphQLString}, slug: {type: GraphQLSlug}},
      description: 'This query takes either the ID or the slug and returns the peer profile.',
      resolve: (root, {id, slug}, {loaders: {peer, peerBySlug}}) =>
        getPeerByIdOrSlug(id, slug, peer, peerBySlug)
    },

    // Author
    // ======

    author: {
      type: GraphQLAuthor,
      args: {id: {type: GraphQLString}, slug: {type: GraphQLSlug}},
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
        cursor: {type: GraphQLString},
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

    // Comments
    // =======

    comments: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicComment))),
      args: {
        itemId: {type: new GraphQLNonNull(GraphQLString)},
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
      args: {id: {type: GraphQLString}, slug: {type: GraphQLSlug}},
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
        cursor: {type: GraphQLString},
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
        id: {type: new GraphQLNonNull(GraphQLString)}
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
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {prisma: {poll}}) => getPoll(id, poll)
    },

    userPollVote: {
      type: GraphQLString,
      description: 'This query returns the answerId of a poll if the user has already voted on it.',
      args: {
        pollId: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {pollId}, {authenticateUser, prisma: {pollVote}}) =>
        userPollVote(pollId, authenticateUser, pollVote)
    },

    // Tag
    // ==========

    tags: {
      type: GraphQLTagConnection,
      description: 'This query returns a list of tags',
      args: {
        cursor: {type: GraphQLString},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLTagFilter},
        sort: {type: GraphQLTagSort, defaultValue: TagSort.CreatedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {filter, sort, order, cursor, take, skip}, {prisma}) =>
        getTags(filter, sort, order, cursor, skip, take, prisma.tag)
    }
  }
})
