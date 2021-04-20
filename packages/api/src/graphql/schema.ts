import {GraphQLObjectType, GraphQLSchema} from 'graphql'
import {getGraphQLPrivateQuery} from './query.private'
import {getGraphQLPrivateMutation} from './mutation.private'
import {GraphQLPublicMutation} from './mutation.public'
import {getGraphQLContent} from './content/content'
import {ContextOptions} from '../context'
import {getGraphQLPublicQuery} from './query.public'
import {Context} from '..'

export function getGraphQLWepublishSchemas(
  contextOptions: ContextOptions,
  extensionQueryPrivate?: GraphQLObjectType<any, Context>,
  extensionMutationPrivate?: GraphQLObjectType<any, Context>
) {
  const contentSchema = getGraphQLContent(contextOptions)
  return {
    privateSchema: new GraphQLSchema({
      query: getGraphQLPrivateQuery(contentSchema?.queryPrivate, extensionQueryPrivate),
      mutation: getGraphQLPrivateMutation(contentSchema?.mutationPrivate, extensionMutationPrivate)
    }),
    publicSchema: new GraphQLSchema({
      query: getGraphQLPublicQuery(contentSchema?.queryPublic),
      mutation: GraphQLPublicMutation
    })
  }
}
