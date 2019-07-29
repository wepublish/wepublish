import {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLID} from 'graphql'

export const GraphQLPeer = new GraphQLObjectType({
  name: 'Peer',

  fields: {
    id: {
      type: GraphQLNonNull(GraphQLID)
    },
    name: {
      type: GraphQLNonNull(GraphQLString)
    },
    url: {
      type: GraphQLNonNull(GraphQLString)
    }
  }
})

export default GraphQLPeer
