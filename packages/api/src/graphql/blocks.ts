import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInterfaceType,
  GraphQLID,
  GraphQLInt,
  GraphQLList
} from 'graphql'

import {BlockType} from '../types'
import {GraphQLRichText} from './richText'
import {GraphQLImage} from './image'
import {GraphQLArticle} from './article'
import {AdapterImageBlock, AdapterArticleGridBlock} from '../adapter'
import {Context} from '../context'

export const GraphQLBaseBlock = new GraphQLInterfaceType({
  name: 'BaseBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLRichTextBlock = new GraphQLObjectType({
  name: BlockType.RichText,
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    richText: {type: GraphQLNonNull(GraphQLRichText)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.RichText
  }
})

export const GraphQLImageBlock = new GraphQLObjectType<AdapterImageBlock, Context>({
  name: BlockType.Image,
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    image: {
      type: GraphQLImage,
      resolve({imageID}, _args, {adapter}) {
        return adapter.getImage(imageID)
      }
    }
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.Image
  }
})

export const GraphQLArticleGridBlock = new GraphQLObjectType<AdapterArticleGridBlock, Context>({
  name: BlockType.ArticleGrid,
  fields: () => ({
    key: {type: GraphQLNonNull(GraphQLID)},
    articles: {
      type: GraphQLNonNull(GraphQLList(GraphQLArticle)),
      resolve({articleIDs}, _args, {adapter}) {
        return Promise.all(articleIDs.map(id => adapter.getArticle(id)))
      }
    },
    numColumns: {type: GraphQLNonNull(GraphQLInt)}
  }),
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.ArticleGrid
  }
})

export const GraphQLInputRichTextBlock = new GraphQLInputObjectType({
  name: 'InputRichTextBlock',
  fields: {
    richText: {
      type: GraphQLNonNull(GraphQLString)
    }
  }
})
