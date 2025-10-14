import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { GraphQLError, GraphQLScalarType, Kind } from 'graphql/index';
import { Descendant } from 'slate';

@ObjectType()
export class FullPoll {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  question?: string | null;

  @Field(() => Date)
  opensAt!: Date;

  @Field(() => Date, { nullable: true })
  closedAt?: Date | null;

  @Field(() => GraphQLRichText, { nullable: true })
  infoText?: Descendant[];

  @Field(() => [PollAnswerWithVoteCount])
  answers!: PollAnswerWithVoteCount[];

  @Field(() => [PollExternalVoteSource])
  externalVoteSources!: PollExternalVoteSource[];
}

@ObjectType()
export class PollAnswerWithVoteCount {
  @Field()
  id!: string;

  @Field()
  pollId!: string;

  @Field(() => String, { nullable: true })
  answer?: string | null;

  _count!: any;

  @Field(() => Int)
  votes!: number;
}

@ObjectType()
export class PollExternalVoteSource {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  source?: string | null;

  @Field(() => [PollExternalVote])
  voteAmounts!: PollExternalVote[];
}

@ObjectType()
export class PollExternalVote {
  @Field()
  id!: string;

  @Field()
  answerId!: string;

  @Field(() => VoteValue)
  amount!: number;
}

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
