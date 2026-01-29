import {
  ArgsType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { RatingSystemType } from '@prisma/client';

registerEnumType(RatingSystemType, {
  name: 'RatingSystemType',
});

@ObjectType()
export class CommentRatingSystemAnswer {
  @Field()
  id!: string;

  @Field()
  ratingSystemId!: string;

  @Field(() => String, { nullable: true })
  answer?: string;

  @Field(() => RatingSystemType)
  type!: RatingSystemType;
}

@ArgsType()
export class CreateCommentRatingSystemAnswerInput extends PickType(
  CommentRatingSystemAnswer,
  ['ratingSystemId', 'type', 'answer'] as const,
  ArgsType
) {}

@InputType()
export class UpdateCommentRatingSystemAnswerInput extends OmitType(
  PartialType(CreateCommentRatingSystemAnswerInput),
  ['ratingSystemId'] as const,
  InputType
) {
  @Field()
  id!: string;
}

@ObjectType()
export class OverriddenRating {
  @Field()
  answerId!: string;

  @Field(() => Int, { nullable: true })
  value?: number;
}

@ObjectType()
export class CommentRating {
  @Field()
  id!: string;
  @Field(() => Date)
  createdAt!: Date;
  @Field(() => Date)
  modifiedAt!: Date;

  @Field(() => String, { nullable: true })
  userId?: string;

  @Field()
  commentId!: string;

  @Field(() => Int)
  value!: number;

  @Field(() => String, { nullable: true })
  fingerprint?: string;

  @Field(() => Boolean, { nullable: true })
  disabled?: boolean;

  @Field(() => CommentRatingSystemAnswer)
  answer!: CommentRatingSystemAnswer;
}

@ObjectType()
export class CalculatedRating {
  @Field(() => Int)
  count!: number;

  @Field(() => Int)
  total!: number;

  @Field(() => Float)
  mean!: number;

  @Field(() => CommentRatingSystemAnswer)
  answer!: CommentRatingSystemAnswer;
}

@ObjectType()
export class CommentRatingSystem {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => [CommentRatingSystemAnswer])
  answers!: CommentRatingSystemAnswer[];
}

@ArgsType()
export class CreateCommentRatingSystemInput extends PickType(
  CommentRatingSystem,
  ['name'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateCommentRatingSystemInput extends PartialType(
  CreateCommentRatingSystemInput,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(() => [UpdateCommentRatingSystemAnswerInput], { nullable: true })
  answers?: UpdateCommentRatingSystemAnswerInput[];
}
