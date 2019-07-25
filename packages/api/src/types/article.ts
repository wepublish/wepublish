import {GraphQLObjectType, GraphQLString, GraphQLNonNull} from 'graphql'

export const articleType = new GraphQLObjectType({
  name: 'Article',

  fields: {
    id: {
      type: GraphQLNonNull(GraphQLString)
    },
    title: {
      type: GraphQLNonNull(GraphQLString)
    },
    lead: {
      type: GraphQLString
    }
  }
})

export default articleType
