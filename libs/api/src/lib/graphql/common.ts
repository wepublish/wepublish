import {SortOrder} from '@wepublish/utils/api'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {DateFilterComparison} from '../db/common'

export const GraphQLSortOrder = new GraphQLEnumType({
  name: 'SortOrder',
  values: {
    Ascending: {value: SortOrder.Ascending},
    Descending: {value: SortOrder.Descending}
  }
})

export const GraphQLPageInfo = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    startCursor: {type: GraphQLString},
    endCursor: {type: GraphQLString},
    hasNextPage: {type: new GraphQLNonNull(GraphQLBoolean)},
    hasPreviousPage: {type: new GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLUnidirectionalPageInfo = new GraphQLObjectType({
  name: 'UnidirectionalPageInfo',
  fields: {
    endCursor: {type: GraphQLString},
    hasNextPage: {type: new GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMetadataProperty = new GraphQLObjectType({
  name: 'Properties',
  fields: {
    key: {type: new GraphQLNonNull(GraphQLString)},
    value: {type: new GraphQLNonNull(GraphQLString)},
    public: {type: new GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMetadataPropertyPublic = new GraphQLObjectType({
  name: 'PublicProperties',
  fields: {
    key: {type: new GraphQLNonNull(GraphQLString)},
    value: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLMetadataPropertyInput = new GraphQLInputObjectType({
  name: 'PropertiesInput',
  fields: {
    key: {type: new GraphQLNonNull(GraphQLString)},
    value: {type: new GraphQLNonNull(GraphQLString)},
    public: {type: new GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLMetadataPropertyPublicInput = new GraphQLInputObjectType({
  name: 'PublicPropertiesInput',
  fields: {
    key: {type: new GraphQLNonNull(GraphQLString)},
    value: {type: new GraphQLNonNull(GraphQLString)}
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
    comparison: {type: new GraphQLNonNull(GraphQLDateFilterComparison)}
  }
})
