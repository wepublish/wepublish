import {GraphQLSchema} from 'graphql'
import {getGraphQLQuery} from './query.private'
import {getGraphQLAdminMutation} from './mutation.private'
import {GraphQLPublicMutation} from './mutation.public'
import {getGraphQLCustomContent} from './content/content'
import {ContextOptions} from '../context'
import {getGraphQLPublicQuery} from './query.public'

export function getGraphQLWepublishSchema(contextOptions: ContextOptions) {
  const {mutation, query} = getGraphQLCustomContent(contextOptions)
  return new GraphQLSchema({
    query: getGraphQLQuery(query),
    mutation: getGraphQLAdminMutation(mutation)
  })
}

export function getGraphQLWepublishPublicSchema(contextOptions: ContextOptions) {
  const {queryPublic} = getGraphQLCustomContent(contextOptions)
  return new GraphQLSchema({
    query: getGraphQLPublicQuery(queryPublic),
    mutation: GraphQLPublicMutation
  })
}
