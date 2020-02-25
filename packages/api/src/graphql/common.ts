import {GraphQLEnumType} from 'graphql'
import {SortOrder} from '../db/common'

export const GraphQLSortOrder = new GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASCENDING: {value: SortOrder.Ascending},
    DESCENDING: {value: SortOrder.Descending}
  }
})
