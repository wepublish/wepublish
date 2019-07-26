import {GraphQLObjectType, GraphQLString, GraphQLNonNull} from 'graphql'

export const articleType = new GraphQLObjectType({
  name: 'Article',

  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString)
    },
    title: {
      type: new GraphQLNonNull(GraphQLString)
    },
    lead: {
      type: GraphQLString
    }
  }
})

export default articleType
