import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType
} from 'graphql'

import articleType from './article'

import Context from '../context'

import {ArticleCreateArguments} from '../adapter'
import {generateID} from '../utility'

export const articleInputType = new GraphQLInputObjectType({
  name: 'ArticleInput',
  fields: {
    title: {
      type: GraphQLNonNull(GraphQLString)
    },
    lead: {
      type: GraphQLNonNull(GraphQLString)
    }
  }
})

export const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createArticle: {
      type: articleType,
      args: {
        article: {
          type: GraphQLNonNull(articleInputType),
          description: 'Article to create.'
        }
      },
      resolve(_root, args: ArticleCreateArguments, context: Context) {
        return context.adapter.createArticle(generateID(), args)
      }
    }
  }
})

export default mutationType
