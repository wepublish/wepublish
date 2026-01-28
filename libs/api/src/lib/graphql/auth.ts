import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

export const GraphQLJWTToken = new GraphQLObjectType({
  name: 'JWTToken',
  fields: {
    token: { type: new GraphQLNonNull(GraphQLString) },
    expiresAt: { type: new GraphQLNonNull(GraphQLString) },
  },
});
