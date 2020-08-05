import {MemberPlan, MemberPlanSort} from '../db/memberPlan'

import {GraphQLRichText} from './richText'
import {GraphQLImage} from './image'
import {Context} from '../context'
import {createProxyingResolver} from '../utility'
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLEnumType
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLPageInfo} from './common'

export const GraphQLMemberPlan = new GraphQLObjectType<MemberPlan, Context>({
  name: 'MemberPlan',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    label: {type: GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },
    description: {type: GraphQLRichText},
    isActive: {type: GraphQLNonNull(GraphQLBoolean)},
    availablePaymentPeriodicity: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    minimumDuration: {type: GraphQLNonNull(GraphQLInt)},
    forceAutoRenewal: {type: GraphQLNonNull(GraphQLBoolean)},
    pricePerMonthMinimum: {type: GraphQLNonNull(GraphQLInt)},
    pricePerMonthMaximum: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLMemberPlanFilter = new GraphQLInputObjectType({
  name: 'MemberPlanFilter',
  fields: {
    label: {type: GraphQLString}
  }
})

export const GraphQLMemberPlanSort = new GraphQLEnumType({
  name: 'MemberPlanSort',
  values: {
    CREATED_AT: {value: MemberPlanSort.CreatedAt},
    MODIFIED_AT: {value: MemberPlanSort.ModifiedAt}
  }
})

export const GraphQLMemberPlanConnection = new GraphQLObjectType<any, Context>({
  name: 'MemberPlanConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMemberPlan)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLMemberPlanInput = new GraphQLInputObjectType({
  name: 'MemberPlanInput',
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    image: {type: GraphQLID},
    description: {type: GraphQLRichText},
    isActive: {type: GraphQLNonNull(GraphQLBoolean)},
    availablePaymentPeriodicity: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    minimumDuration: {type: GraphQLNonNull(GraphQLInt)},
    forceAutoRenewal: {type: GraphQLNonNull(GraphQLBoolean)},
    pricePerMonthMinimum: {type: GraphQLNonNull(GraphQLInt)},
    pricePerMonthMaximum: {type: GraphQLNonNull(GraphQLInt)}
  }
})
