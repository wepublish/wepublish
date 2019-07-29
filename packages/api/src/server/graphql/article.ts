import {GraphQLObjectType, GraphQLString, GraphQLNonNull} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLArticle = new GraphQLObjectType({
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
    },
    publishedDate: {type: GraphQLDateTime}
  }
})

export default GraphQLArticle
