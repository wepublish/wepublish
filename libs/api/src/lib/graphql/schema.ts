import {GraphQLSchema} from 'graphql'

import {GraphQLQuery} from './query.private'
import {GraphQLPublicQuery} from './query.public'
import {GraphQLAdminMutation} from './mutation.private'
import {GraphQLPublicMutation} from './mutation.public'

export const GraphQLWepublishSchema = new GraphQLSchema({
  query: GraphQLQuery,
  mutation: GraphQLAdminMutation
})

export const GraphQLWepublishPublicSchema = new GraphQLSchema({
  query: GraphQLPublicQuery,
  mutation: GraphQLPublicMutation
})
