import {
  GraphQLEnumType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLObjectType
} from 'graphql'

import {SortOrder} from '../db/common'

export const GraphQLSortOrder = new GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASCENDING: {value: SortOrder.Ascending},
    DESCENDING: {value: SortOrder.Descending}
  }
})

export const GraphQLPageInfo = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    startCursor: {type: GraphQLString},
    endCursor: {type: GraphQLString},
    hasNextPage: {type: GraphQLNonNull(GraphQLBoolean)},
    hasPreviousPage: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})
