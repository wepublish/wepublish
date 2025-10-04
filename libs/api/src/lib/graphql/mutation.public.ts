import { GraphQLObjectType } from 'graphql';
import { Context } from '../context';

export const GraphQLPublicMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {},
});
