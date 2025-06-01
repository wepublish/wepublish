import {AuthSessionType} from '@wepublish/authentication/api'
import {GraphQLSlug, SortOrder} from '@wepublish/utils/api'
import {UserInputError} from 'apollo-server-express'
import {GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'
import {MemberPlanSort} from '../db/memberPlan'
import {GraphQLChallenge} from './challenge'
import {GraphQLFullCommentRatingSystem} from './comment-rating/comment-rating'
import {getRatingSystem} from './comment-rating/comment-rating.public-queries'
import {GraphQLPublicComment, GraphQLPublicCommentSort} from './comment/comment'
import {getPublicCommentsForItemById} from './comment/comment.public-queries'
import {GraphQLSortOrder} from './common'
import {getActiveMemberPlans} from './member-plan/member-plan.public-queries'
import {
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort,
  GraphQLPublicMemberPlan,
  GraphQLPublicMemberPlanConnection
} from './memberPlan'
import {GraphQLPublicSubscription} from './subscription-public'
import {GraphQLPublicUser} from './user'

export const GraphQLPublicQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
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
    }
  }
})
