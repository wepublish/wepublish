import {
  AvailablePaymentMethod,
  MemberPlan,
  MemberPlanSort,
  PaymentPeriodicity
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
import {GraphQLPaymentMethod, GraphQLPublicPaymentMethod} from './paymentMethod'

export const GraphQLPaymentPeriodicity = new GraphQLEnumType({
  name: 'PaymentPeriodicity',
  values: {
    MONTHLY: {value: PaymentPeriodicity.Monthly},
    QUARTERLY: {value: PaymentPeriodicity.Quarterly},
    BIANNUAL: {value: PaymentPeriodicity.Biannual},
    YEARLY: {value: PaymentPeriodicity.Yearly}
  }
})

export const GraphQLAvailablePaymentMethod = new GraphQLObjectType<AvailablePaymentMethod, Context>(
  {
    name: 'AvailablePaymentMethod',
    fields: {
      paymentMethods: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentMethod))),
        async resolve({paymentMethodIDs}, args, {dbAdapter}) {
          const paymentMethods = await dbAdapter.paymentMethod.getPaymentMethods()
          return paymentMethods.filter(paymentMethod => paymentMethodIDs.includes(paymentMethod.id))
        }
      },
      paymentPeriodicities: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentPeriodicity)))
      },
      forceAutoRenewal: {type: GraphQLNonNull(GraphQLBoolean)}
    }
  }
)

export const GraphQLPublicAvailablePaymentMethod = new GraphQLObjectType<
  AvailablePaymentMethod,
  Context
>({
  name: 'AvailablePaymentMethod',
  fields: {
    paymentMethods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicPaymentMethod))),
      async resolve({paymentMethodIDs}, args, {dbAdapter}) {
        const paymentMethods = await dbAdapter.paymentMethod.getActivePaymentMethods()
        return paymentMethods.filter(paymentMethod => paymentMethodIDs.includes(paymentMethod.id))
      }
    },
    paymentPeriodicities: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentPeriodicity)))
    },
    forceAutoRenewal: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMemberPlan = new GraphQLObjectType<MemberPlan, Context>({
  name: 'MemberPlan',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },
    description: {type: GraphQLRichText},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))},
    active: {type: GraphQLNonNull(GraphQLBoolean)},
    amountPerMonthMin: {type: GraphQLNonNull(GraphQLInt)},
    availablePaymentMethods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAvailablePaymentMethod)))
    }
  }
})

export const GraphQLPublicMemberPlan = new GraphQLObjectType<MemberPlan, Context>({
  name: 'MemberPlan',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },
    description: {type: GraphQLRichText},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))},
    amountPerMonthMin: {type: GraphQLNonNull(GraphQLInt)},
    availablePaymentMethods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicAvailablePaymentMethod)))
    }
  }
})

export const GraphQLMemberPlanFilter = new GraphQLInputObjectType({
  name: 'MemberPlanFilter',
  fields: {
    name: {type: GraphQLString},
    active: {type: GraphQLBoolean},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
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

export const GraphQLPublicMemberPlanConnection = new GraphQLObjectType<any, Context>({
  name: 'MemberPlanConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicMemberPlan)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLAvailablePaymentMethodInput = new GraphQLInputObjectType({
  name: 'AvailablePaymentMethodInput',
  fields: {
    paymentMethodIDs: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    paymentPeriodicities: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentPeriodicity)))
    },
    forceAutoRenewal: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMemberPlanInput = new GraphQLInputObjectType({
  name: 'MemberPlanInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLString)},
    imageID: {type: GraphQLID},
    description: {type: GraphQLRichText},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))},
    active: {type: GraphQLNonNull(GraphQLBoolean)},
    amountPerMonthMin: {type: GraphQLNonNull(GraphQLInt)},
    availablePaymentMethods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAvailablePaymentMethodInput)))
    }
  }
})
