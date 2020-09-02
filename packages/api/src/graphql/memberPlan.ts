import {
  AllPaymentPeriodicity,
  AvailablePaymentMethod,
  MemberPlan,
  MemberPlanSort
} from '../db/memberPlan'

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
import {GraphQLPaymentMethod} from './paymentMethod'

export const GraphQLPaymentPeriodicity = new GraphQLObjectType({
  name: 'PaymentPeriodicity',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    checked: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLAvailablePaymentMethod = new GraphQLObjectType<AvailablePaymentMethod, Context>(
  {
    name: 'AvailablePaymentMethod',
    fields: {
      paymentMethod: {
        type: GraphQLNonNull(GraphQLPaymentMethod),
        async resolve({paymentMethodId}, args, {dbAdapter}) {
          const paymentMethods = await dbAdapter.paymentMethod.getPaymentMethods()
          return paymentMethods.find(paymentMethod => paymentMethod.id === paymentMethodId)
        }
      },
      paymentPeriodicity: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentPeriodicity))),
        resolve({paymentPeriodicity: selectedPaymentPeriodicity}, args) {
          return AllPaymentPeriodicity.map(paymentPeriodicity => {
            return {
              id: paymentPeriodicity,
              checked: selectedPaymentPeriodicity.includes(paymentPeriodicity)
            }
          })
        }
      },
      minimumDurationMonths: {type: GraphQLNonNull(GraphQLInt)},
      forceAutoRenewal: {type: GraphQLNonNull(GraphQLBoolean)}
    }
  }
)

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
    pricePerMonthMinimum: {type: GraphQLNonNull(GraphQLInt)},
    pricePerMonthMaximum: {type: GraphQLNonNull(GraphQLInt)},
    availablePaymentMethods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAvailablePaymentMethod)))
    }
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

export const GraphQLAvailablePaymentMethodInput = new GraphQLInputObjectType({
  name: 'AvailablePaymentMethodInput',
  fields: {
    paymentMethodId: {type: GraphQLNonNull(GraphQLString)},
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    minimumDurationMonths: {type: GraphQLNonNull(GraphQLInt)},
    forceAutoRenewal: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMemberPlanInput = new GraphQLInputObjectType({
  name: 'MemberPlanInput',
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    image: {type: GraphQLID},
    description: {type: GraphQLRichText},
    isActive: {type: GraphQLNonNull(GraphQLBoolean)},
    pricePerMonthMinimum: {type: GraphQLNonNull(GraphQLInt)},
    pricePerMonthMaximum: {type: GraphQLNonNull(GraphQLInt)},
    availablePaymentMethods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAvailablePaymentMethodInput)))
    }
  }
})
