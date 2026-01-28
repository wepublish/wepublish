import { GraphQLScalarType, valueFromAST, GraphQLString } from 'graphql';
import { slugify } from '@wepublish/utils';

export const GraphQLSlug = new GraphQLScalarType({
  name: 'Slug',
  serialize(value) {
    return value;
  },

  parseValue(value) {
    if (typeof value != 'string') {
      throw new Error();
    }

    return slugify(value);
  },

  parseLiteral(literal) {
    const value = valueFromAST(literal, GraphQLString) as string | undefined;

    if (value == null) {
      throw new Error();
    }

    return slugify(value);
  },
});
