import {Tag, TagType} from '@prisma/client'
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {Context} from '../../context'
import {GraphQLPageInfo} from '../common'
import {TagSort} from './tag.query'

export const GraphQLTagType = new GraphQLEnumType({
  name: 'TagType',
  values: {
    Comment: {value: TagType.Comment},
    Event: {value: TagType.Event},
    Author: {value: TagType.Author}
  }
})

export const GraphQLTag = new GraphQLObjectType<Tag, Context>({
  name: 'Tag',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    tag: {type: GraphQLString},
    type: {type: GraphQLTagType}
  }
})

export const GraphQLTagConnection = new GraphQLObjectType({
  name: 'TagConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLTag)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLTagFilter = new GraphQLInputObjectType({
  name: 'TagFilter',
  fields: {
    type: {type: GraphQLTagType},
    tag: {type: GraphQLString}
  }
})

export const GraphQLTagSort = new GraphQLEnumType({
  name: 'TagSort',
  values: {
    CREATED_AT: {value: TagSort.CreatedAt},
    MODIFIED_AT: {value: TagSort.ModifiedAt},
    TAG: {value: TagSort.Tag}
  }
})
