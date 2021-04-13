import {GraphQLObjectType, GraphQLSchema} from 'graphql'
import {getGraphQLPrivateQuery} from './query.private'
import {getGraphQLPrivateMutation} from './mutation.private'
import {GraphQLPublicMutation} from './mutation.public'
import {getGraphQLCustomContent} from './content/content'
import {ContextOptions} from '../context'
import {getGraphQLPublicQuery} from './query.public'
import {Context} from '..'

export function getGraphQLWepublishSchemas(
  contextOptions: ContextOptions,
  extensionQueryPrivate?: GraphQLObjectType<any, Context>,
  extensionMutationPrivate?: GraphQLObjectType<any, Context>
) {
  const {mutation, query, queryPublic} = getGraphQLCustomContent(contextOptions)
  return {
    privateSchema: new GraphQLSchema({
      query: getGraphQLPrivateQuery(query, extensionQueryPrivate),
      mutation: getGraphQLPrivateMutation(mutation, extensionMutationPrivate)
    }),
    publicSchema: new GraphQLSchema({
      query: getGraphQLPublicQuery(queryPublic),
      mutation: GraphQLPublicMutation
    })
  }
}
