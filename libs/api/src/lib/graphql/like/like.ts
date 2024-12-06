import {GraphQLInputObjectType, GraphQLNonNull, GraphQLID} from 'graphql'

export const GraphQLPublicLikeCreateInput = new GraphQLInputObjectType({
  name: 'LikeCreateInput',
  fields: {
    articleId: {type: new GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLPublicLikeDeleteInput = new GraphQLInputObjectType({
  name: 'LikeDeleteInput',
  fields: {
    articleId: {type: new GraphQLNonNull(GraphQLID)}
  }
})
