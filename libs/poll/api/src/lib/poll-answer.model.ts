import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
} from '@nestjs/graphql';

@ObjectType()
export class PollAnswer {
  @Field()
  id!: string;

  @Field()
  pollId!: string;

  @Field(() => String, { nullable: true })
  answer?: string | null;

  @Field(() => Int)
  votes!: number;
}

@InputType()
export class PollAnswerInput extends OmitType(
  PollAnswer,
  ['votes', 'pollId'] as const,
  InputType
) {}

@ArgsType()
export class CreatePollAnswerInput extends OmitType(
  PollAnswer,
  ['id', 'votes'] as const,
  ArgsType
) {}
