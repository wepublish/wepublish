import {MemberPlan, MemberPlanSort} from '../db/memberPlan'

import {GraphQLRichText} from '@wepublish/richtext/api'
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
import {GraphQLDateTime} from 'graphql-scalars'
import {GraphQLPageInfo} from './common'
import {GraphQLPaymentMethod, GraphQLPublicPaymentMethod} from './paymentMethod'
import {AvailablePaymentMethod, Currency, PaymentPeriodicity} from '@prisma/client'

export const GraphQLSupportedCurrency = new GraphQLEnumType({
  name: 'Currency',
  values: {
    CHF: {value: Currency.CHF},
    EUR: {value: Currency.EUR}
  }
})

export const GraphQLPaymentPeriodicity = new GraphQLEnumType({
  name: 'PaymentPeriodicity',
  values: {
    MONTHLY: {value: PaymentPeriodicity.monthly},
    QUARTERLY: {value: PaymentPeriodicity.quarterly},
    BIANNUAL: {value: PaymentPeriodicity.biannual},
    YEARLY: {value: PaymentPeriodicity.yearly}
  }
})

export const GraphQLAvailablePaymentMethod = new GraphQLObjectType<AvailablePaymentMethod, Context>(
  {
    name: 'AvailablePaymentMethod',
    fields: {
      paymentMethods: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPaymentMethod))),
        async resolve({paymentMethodIDs}, args, {prisma: {paymentMethod}}) {
          const paymentMethods = await paymentMethod.findMany({
            where: {
              id: {
                in: paymentMethodIDs
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          })

          return paymentMethods
        }
      },
      paymentPeriodicities: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPaymentPeriodicity)))
      },
      forceAutoRenewal: {type: new GraphQLNonNull(GraphQLBoolean)}
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
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicPaymentMethod))),
      async resolve({paymentMethodIDs}, args, {prisma: {paymentMethod}}) {
        const paymentMethods = await paymentMethod.findMany({
          where: {
            id: {
              in: paymentMethodIDs
            },
            active: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        return paymentMethods
      }
    },
    paymentPeriodicities: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPaymentPeriodicity)))
    },
    forceAutoRenewal: {type: new GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMemberPlan = new GraphQLObjectType<MemberPlan, Context>({
  name: 'MemberPlan',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    name: {type: new GraphQLNonNull(GraphQLString)},
    slug: {type: new GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },
    description: {type: GraphQLRichText},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},
    active: {type: new GraphQLNonNull(GraphQLBoolean)},
    amountPerMonthMin: {type: new GraphQLNonNull(GraphQLInt)},
    currency: {type: new GraphQLNonNull(GraphQLSupportedCurrency)},
    maxCount: {type: GraphQLInt},
    extendable: {type: new GraphQLNonNull(GraphQLBoolean)},
    availablePaymentMethods: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLAvailablePaymentMethod)))
    }
  }
})

export const GraphQLPublicMemberPlan = new GraphQLObjectType<MemberPlan, Context>({
  name: 'MemberPlan',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},

    name: {type: new GraphQLNonNull(GraphQLString)},
    slug: {type: new GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },
    description: {type: GraphQLRichText},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},
    currency: {type: new GraphQLNonNull(GraphQLSupportedCurrency)},
    amountPerMonthMin: {type: new GraphQLNonNull(GraphQLInt)},
    maxCount: {type: GraphQLInt},
    extendable: {type: new GraphQLNonNull(GraphQLBoolean)},
    availablePaymentMethods: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPublicAvailablePaymentMethod))
      )
    }
  }
})

export const GraphQLMemberPlanFilter = new GraphQLInputObjectType({
  name: 'MemberPlanFilter',
  fields: {
    name: {type: GraphQLString},
    active: {type: GraphQLBoolean},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))}
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
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMemberPlan)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicMemberPlanConnection = new GraphQLObjectType<any, Context>({
  name: 'MemberPlanConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicMemberPlan)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLAvailablePaymentMethodInput = new GraphQLInputObjectType({
  name: 'AvailablePaymentMethodInput',
  fields: {
    paymentMethodIDs: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)))
    },
    paymentPeriodicities: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPaymentPeriodicity)))
    },
    forceAutoRenewal: {type: new GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMemberPlanInput = new GraphQLInputObjectType({
  name: 'MemberPlanInput',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLString)},
    slug: {type: new GraphQLNonNull(GraphQLString)},
    imageID: {type: GraphQLID},
    description: {type: GraphQLRichText},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},
    active: {type: new GraphQLNonNull(GraphQLBoolean)},
    amountPerMonthMin: {type: new GraphQLNonNull(GraphQLInt)},
    currency: {type: new GraphQLNonNull(GraphQLSupportedCurrency)},
    extendable: {type: new GraphQLNonNull(GraphQLBoolean)},
    maxCount: {type: GraphQLInt},
    availablePaymentMethods: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLAvailablePaymentMethodInput))
      )
    }
  }
})
