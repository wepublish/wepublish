import {GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'
import {GraphQLDate} from 'graphql-iso-date'

export const GraphQLChallenge: GraphQLObjectType<Context> = new GraphQLObjectType<Context>({
  name: 'Challenge',
  fields: () => ({
    challenge: {type: GraphQLString},
    challengeID: {type: GraphQLString},
    validUntil: {type: GraphQLDate}
  })
})
