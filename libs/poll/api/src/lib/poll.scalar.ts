import { GraphQLError, GraphQLScalarType, Kind } from 'graphql/index';

const validateVoteValue = (voteValue: unknown): number => {
  if (typeof voteValue !== 'number') {
    throw new GraphQLError(`Value is not a number: ${voteValue}`);
  }

  if (voteValue < 0) {
    throw new GraphQLError(`Value can not be below 0.`);
  }

  return voteValue;
};

export const VoteValue = new GraphQLScalarType({
  name: 'VoteValue',
  description: 'A valid vote value',
  serialize: validateVoteValue,
  parseValue: validateVoteValue,
  parseLiteral: ast => {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Query error: Can only parse numbers as vote values but got a: ${ast.kind}`
      );
    }

    return validateVoteValue(ast.value);
  },
});
