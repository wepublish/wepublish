import {GraphQLSlug, SortOrder} from '@wepublish/utils/api'
import {UserInputError} from 'apollo-server-express'
import {GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'
import {MemberPlanSort} from '../db/memberPlan'
import {GraphQLSortOrder} from './common'
import {getActiveMemberPlans} from './member-plan/member-plan.public-queries'
import {
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort,
  GraphQLPublicMemberPlan,
  GraphQLPublicMemberPlanConnection
} from './memberPlan'

export const GraphQLPublicQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
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
    }
  }
})
