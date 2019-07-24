import {RequestListener} from 'http'
import {GraphQLSchema, GraphQLObjectType, GraphQLString} from 'graphql'
import graphqlHTTP from 'express-graphql'

export interface Adapter {
  getArticle(): any
  getArticles(): any
  createArticle(): any
  updateArticle(): any
}

export interface HandlerOptions {
  adapter: Adapter
}

export function createAPIHandler(opts: HandlerOptions): RequestListener {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Root',
      fields: {
        test: {
          type: GraphQLString,
          resolve() {
            return 'test'
          }
        }
      }
    })
  })

  return graphqlHTTP({
    schema,
    graphiql: true
  })
}

export default createAPIHandler
