import {Tag, TagType} from '@prisma/client'
import {
  GraphQLBoolean,
  GraphQLEnumType,
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
import {createProxyingResolver} from '../../utility'

export const GraphQLTagType = new GraphQLEnumType({
  name: 'TagType',
  values: {
    [TagType.Comment]: {value: TagType.Comment},
    [TagType.Event]: {value: TagType.Event},
    [TagType.Author]: {value: TagType.Author},
    [TagType.Article]: {value: TagType.Article},
    [TagType.Page]: {value: TagType.Page}
  }
})

export const GraphQLTag = new GraphQLObjectType<Tag, Context>({
  name: 'Tag',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    tag: {type: GraphQLString},
    type: {type: GraphQLTagType},
    main: {type: new GraphQLNonNull(GraphQLBoolean)},
    url: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(async (tag, _, {urlAdapter}) => {
        return await urlAdapter.getTagURL(tag)
      })
    }
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
    [TagSort.CreatedAt]: {value: TagSort.CreatedAt},
    [TagSort.ModifiedAt]: {value: TagSort.ModifiedAt},
    [TagSort.Tag]: {value: TagSort.Tag}
  }
})
