import {GraphQLSchema} from 'graphql'
import {getGraphQLQuery} from './query.private'
import {getGraphQLAdminMutation} from './mutation.private'
import {GraphQLPublicMutation} from './mutation.public'
import {getGraphQLCustomContent} from './content/content'
import {ContextOptions} from '../context'
import {getGraphQLPublicQuery} from './query.public'

export function getGraphQLWepublishSchemas(contextOptions: ContextOptions) {
  const {mutation, query, queryPublic} = getGraphQLCustomContent(contextOptions)
  return {
    privateSchema: new GraphQLSchema({
      query: getGraphQLQuery(query),
      mutation: getGraphQLAdminMutation(mutation)
    }),
    publicSchema: new GraphQLSchema({
      query: getGraphQLPublicQuery(queryPublic),
      mutation: GraphQLPublicMutation
    })
  }
}
