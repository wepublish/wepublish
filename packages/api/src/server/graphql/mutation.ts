import {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLInputObjectType} from 'graphql'

import {GraphQLArticle, GraphQLArticleInput} from './article'
import {Context} from '../context'

import {ArticleCreateArguments} from '../adapter'
import {generateID} from '../../shared'

export const GraphQLMutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createArticle: {
      type: GraphQLArticle,
      args: {
        article: {
          type: GraphQLNonNull(GraphQLArticleInput),
          description: 'Article to create.'
        }
      },
      resolve(_root, args, context: Context) {
        return context.adapter.createArticle(generateID(), args as ArticleCreateArguments)
      }
    }
  }
})

export default GraphQLMutation
