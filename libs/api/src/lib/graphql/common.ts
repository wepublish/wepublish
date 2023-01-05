import {
  GraphQLEnumType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLInputObjectType
} from 'graphql'

import {DateFilterComparison, SortOrder} from '../db/common'
import {GraphQLDateTime} from 'graphql-scalars'

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

export const GraphQLUnidirectionalPageInfo = new GraphQLObjectType({
  name: 'UnidirectionalPageInfo',
  fields: {
    endCursor: {type: GraphQLString},
    hasNextPage: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMetadataProperty = new GraphQLObjectType({
  name: 'Properties',
  fields: {
    key: {type: GraphQLNonNull(GraphQLString)},
    value: {type: GraphQLNonNull(GraphQLString)},
    public: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMetadataPropertyPublic = new GraphQLObjectType({
  name: 'PublicProperties',
  fields: {
    key: {type: GraphQLNonNull(GraphQLString)},
    value: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLMetadataPropertyInput = new GraphQLInputObjectType({
  name: 'PropertiesInput',
  fields: {
    key: {type: GraphQLNonNull(GraphQLString)},
    value: {type: GraphQLNonNull(GraphQLString)},
    public: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMetadataPropertyPublicInput = new GraphQLInputObjectType({
  name: 'PublicPropertiesInput',
  fields: {
    key: {type: GraphQLNonNull(GraphQLString)},
    value: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLDateFilterComparison = new GraphQLEnumType({
  name: 'DateFilterComparison',
  values: {
    GREATER: {value: DateFilterComparison.GreaterThan},
    GREATER_OR_EQUAL: {value: DateFilterComparison.GreaterThanOrEqual},
    EQUAL: {value: DateFilterComparison.Equal},
    LOWER: {value: DateFilterComparison.LowerThan},
    LOWER_OR_EQUAL: {value: DateFilterComparison.LowerThanOrEqual}
  }
})

export const GraphQLDateFilter = new GraphQLInputObjectType({
  name: 'DateFilter',
  fields: {
    date: {type: GraphQLDateTime, defaultValue: null},
    comparison: {type: GraphQLNonNull(GraphQLDateFilterComparison)}
  }
})
