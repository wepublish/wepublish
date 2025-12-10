import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { Descendant } from 'slate';
import { VoteValue } from './poll.scalar';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
import { PollAnswer, PollAnswerInput } from './poll-answer.model';

export enum PollSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  OpensAt = 'OpensAt',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
});

registerEnumType(PollSort, {
  name: 'PollSort',
});

@ObjectType()
export class Poll {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  question?: string;

  @Field(() => Date)
  opensAt!: Date;

  @Field(() => Date, { nullable: true })
  closedAt?: Date;

  @Field(() => GraphQLRichText, { nullable: true })
  infoText?: Descendant[];
}

@ObjectType()
export class PaginatedPolls extends PaginatedType(Poll) {}

@ObjectType()
export class PollExternalVote {
  @Field()
  id!: string;

  @Field()
  answerId!: string;

  @Field(() => VoteValue)
  amount!: number;
}

@InputType()
export class PollExternalVoteInput extends OmitType(
  PollExternalVote,
  ['answerId'] as const,
  InputType
) {}

@ArgsType()
export class CreatePollAnswerInput extends OmitType(
  PollAnswerInput,
  ['id'] as const,
  ArgsType
) {}

@ObjectType()
export class PollExternalVoteSource {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  source?: string | null;

  @Field(() => [PollExternalVote])
  voteAmounts!: PollExternalVote[];
}

@InputType()
export class PollExternalVoteSourceInput extends OmitType(
  PollExternalVoteSource,
  ['voteAmounts'] as const,
  InputType
) {
  @Field(() => [PollExternalVoteInput])
  voteAmounts!: PollExternalVoteInput[];
}

@ArgsType()
export class CreatePollExternalVoteSourceInput extends OmitType(
  PollExternalVoteSourceInput,
  ['id', 'voteAmounts'] as const,
  ArgsType
) {
  @Field()
  pollId!: string;
}

@ObjectType()
export class FullPoll extends Poll {
  @Field(() => [PollAnswer])
  answers!: PollAnswer[];

  @Field(() => [PollExternalVoteSource])
  externalVoteSources!: PollExternalVoteSource[];
}

@InputType()
export class PollFilter {
  @Field({ nullable: true })
  openOnly?: boolean;
}

@ArgsType()
export class PollListArgs {
  @Field(type => PollFilter, { nullable: true })
  filter?: PollFilter;

  @Field(type => PollSort, {
    nullable: true,
    defaultValue: PollSort.OpensAt,
  })
  sort?: PollSort;

  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Descending,
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
export class CreatePollInput extends PickType(
  Poll,
  ['opensAt', 'closedAt', 'infoText', 'question'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdatePollInput extends PartialType(CreatePollInput, ArgsType) {
  @Field()
  id!: string;

  @Field(() => [PollExternalVoteSourceInput])
  externalVoteSources!: PollExternalVoteSourceInput[];

  @Field(() => [PollAnswerInput])
  answers!: PollAnswerInput[];
}
