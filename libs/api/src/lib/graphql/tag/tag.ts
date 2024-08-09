import {Tag, TagType} from '@prisma/client'
import {
  GraphQLBoolean,
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
import {createProxyingResolver} from '../../utility'

export const GraphQLTagType = new GraphQLEnumType({
  name: 'TagType',
  values: {
    Comment: {value: TagType.Comment},
    Event: {value: TagType.Event},
    Author: {value: TagType.Author},
    Article: {value: TagType.Article},
    Page: {value: TagType.Page}
  }
})

export const GraphQLTag = new GraphQLObjectType<Tag, Context>({
  name: 'Tag',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
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

// this is used to filter on all types of content (articles, pages, events etc.) by either tag ids or tag names
export const GraphQLContentTagFilter = new GraphQLInputObjectType({
  name: 'ContentTagFilter',
  fields: {
    ids: {type: new GraphQLList(new GraphQLNonNull(GraphQLID))},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))}
  }
})

// this is used to filter the tags either by content type or tag name.
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
