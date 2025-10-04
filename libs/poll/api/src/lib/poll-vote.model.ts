import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';

@ObjectType()
export class PollAnswerInVote {
  @Field()
  id!: string;

  @Field()
  answer!: string;
}

@ObjectType()
export class PollVote {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  pollId!: string;

  @Field()
  answerId!: string;

  @Field()
  answer!: PollAnswerInVote;

  @Field()
  disabled!: boolean;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  fingerprint?: string;
}

@ObjectType()
export class PaginatedPollVotes extends PaginatedType(PollVote) {}

@InputType()
export class PollVoteFilter {
  @Field({ nullable: true })
  from?: Date;

  @Field({ nullable: true })
  to?: Date;

  @Field({ nullable: true })
  pollId?: string;

  @Field(() => [String], { nullable: true })
  answerIds?: string[];

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  fingerprint?: string;
}

export enum PollVoteSort {
  CreatedAt = 'CreatedAt',
}

registerEnumType(PollVoteSort, {
  name: 'PollVoteSort',
});

@ArgsType()
export class PoleVoteListArgs {
  @Field(type => PollVoteFilter, { nullable: true })
  filter?: PollVoteFilter;

  @Field(type => PollVoteSort, {
    nullable: true,
    defaultValue: PollVoteSort.CreatedAt,
  })
  sort?: PollVoteSort;

  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(type => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(type => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}

@ArgsType()
export class PoleVoteByIdArgs {
  @Field(() => [String])
  ids!: string[];
}

@ObjectType()
export class DeletePollVotesResult {
  @Field(() => Int)
  count!: number;
}
