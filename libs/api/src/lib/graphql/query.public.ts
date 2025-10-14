import { GraphQLObjectType } from 'graphql';
import { Context } from '../context';
import { GraphQLString } from 'graphql/index';

export const GraphQLPublicQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    dummy: {
      type: GraphQLString,
      args: {},
      description: 'Dummy',
      resolve: (
        root,
        { input },
        { authenticateUser, mediaAdapter, prisma: { user, image } }
      ) => 'dummy',
    },
  },
});
