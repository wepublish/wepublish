import {GraphQLObjectType, GraphQLString, GraphQLList, GraphQLNonNull} from 'graphql'
import articleType from './article'
import Context from '../context'
import {ArticleArguments, ArticlesArguments} from '../adapter'

export const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    article: {
      type: articleType,
      args: {
        id: {
          description: 'ID of the Article.',
          type: GraphQLString
        }
      },
      resolve(_root, args: ArticleArguments, context: Context) {
        return context.adapter.getArticle(args)
      }
    },
    articles: {
      type: GraphQLNonNull(GraphQLList(articleType)),
      args: {
        tagsInclude: {
          description: 'A list of tags to match against the Article.',
          type: GraphQLList(GraphQLString)
        },
        peer: {
          description: 'Peer of the Article.',
          type: GraphQLString
        }
      },
      resolve(_root, args: ArticlesArguments, context: Context) {
        // TODO: Fetch peers aswell
        return context.adapter.getArticles(args)
      }
    }
  }
})

export default queryType
