import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  CommentAuthorType,
  CommentItemType,
  CommentRejectionReason,
  CommentState,
} from '@prisma/client';
import { ChallengeInput } from '@wepublish/challenge/api';
import { Image } from '@wepublish/image/api';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { Tag } from '@wepublish/tag/api';
import { HasOptionalUser } from '@wepublish/user/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
import { Descendant } from 'slate';
import {
  CalculatedRating,
  CommentRating,
  OverriddenRating,
  OverriddenRatingInput,
} from './rating-system/rating-system.model';

registerEnumType(CommentAuthorType, {
  name: 'CommentAuthorType',
});
registerEnumType(CommentItemType, {
  name: 'CommentItemType',
});
registerEnumType(CommentState, {
  name: 'CommentState',
});
registerEnumType(CommentRejectionReason, {
  name: 'CommentRejectionReason',
});

export enum CommentSort {
  Rating = 'Rating',
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}
registerEnumType(CommentSort, {
  name: 'CommentSort',
});

@ObjectType()
export class CommentRevision {
  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  lead?: string;

  @Field(() => GraphQLRichText, { nullable: true })
  text?: Descendant[];

  @Field(() => Date)
  createdAt!: Date;
}

@InputType()
export class CommentRevisionInput extends PickType(
  CommentRevision,
  ['title', 'lead', 'text'] as const,
  InputType
) {}

@ObjectType({
  implements: [HasOptionalUser],
})
export class Comment extends HasOptionalUser {
  @Field()
  id!: string;
  @Field(() => Date)
  createdAt!: Date;
  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  itemID!: string;
  @Field(() => CommentItemType)
  itemType!: CommentItemType;

  @Field(() => CommentState)
  state!: CommentState;
  @Field(() => CommentRejectionReason, { nullable: true })
  rejectionReason?: CommentRejectionReason;
  @Field(() => CommentAuthorType)
  authorType!: CommentAuthorType;
  @Field(() => String, { nullable: true })
  source?: string;

  @Field(() => [Tag])
  tags!: Tag[];
  @Field(() => Boolean, { nullable: true })
  featured?: boolean;

  @Field(() => String, { nullable: true })
  parentID?: string;
  @Field(() => Comment, { nullable: true })
  parentComment?: Comment;

  @Field(() => String, { nullable: true })
  guestUsername?: string;
  @Field(() => String, { nullable: true })
  guestUserImageID?: string;
  @Field(() => Image, { nullable: true })
  guestUserImage?: Image;

  @Field(() => [CommentRevision])
  revisions!: CommentRevision[];

  @Field(() => String, { nullable: true })
  title?: string;
  @Field(() => String, { nullable: true })
  lead?: string;
  @Field(() => GraphQLRichText, { nullable: true })
  text?: Descendant[];

  @Field(() => [Comment])
  children!: Comment[];

  @Field()
  url?: string;
  @Field(() => [CalculatedRating])
  calculatedRatings!: CalculatedRating[];
  @Field(() => [CommentRating])
  userRatings!: CommentRating[];
  @Field(() => [OverriddenRating])
  overriddenRatings!: OverriddenRating[];
}

@ObjectType()
export class PaginatedComments extends PaginatedType(Comment) {}

@InputType()
export class CommentFilter {
  @Field(() => [CommentState], { nullable: true })
  states?: CommentState[];
  @Field(() => [String], { nullable: true })
  tags?: string[];
  @Field(() => CommentItemType, { nullable: true })
  itemType?: CommentItemType;
  @Field({ nullable: true })
  itemID?: string;
  @Field({ nullable: true })
  item?: string;
}

@ArgsType()
export class CommentListArgs {
  @Field(type => CommentFilter, { nullable: true })
  filter?: CommentFilter;

  @Field(type => CommentSort, {
    nullable: true,
    defaultValue: CommentSort.ModifiedAt,
  })
  sort?: CommentSort;

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
export class CommentsForItemArgs extends PickType(
  CommentListArgs,
  [] as const,
  ArgsType
) {
  @Field(type => CommentSort, {
    nullable: true,
    defaultValue: CommentSort.Rating,
  })
  sort?: CommentSort;
  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Descending,
  })
  order?: SortOrder;

  @Field()
  itemId!: string;
  @Field(() => CommentItemType)
  itemType!: CommentItemType;
}

@ArgsType()
export class CreateCommentInput extends PickType(
  Comment,
  ['text', 'lead', 'itemID', 'parentID', 'itemType'] as const,
  ArgsType
) {
  @Field(type => [String], { nullable: true })
  tagIds?: string[];
}

@ArgsType()
export class UpdateCommentInput extends PartialType(
  PickType(
    Comment,
    [
      'userID',
      'guestUsername',
      'guestUserImageID',
      'featured',
      'source',
    ] as const,
    ArgsType
  ),
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => [String], { nullable: true })
  tagIds?: string[];

  @Field(type => CommentRevisionInput, { nullable: true })
  revision?: CommentRevisionInput;

  @Field(type => [OverriddenRatingInput], { nullable: true })
  ratingOverrides?: OverriddenRatingInput[];
}

@ArgsType()
export class AddUserCommentInput {
  @Field(() => String, { nullable: true })
  parentID?: string;

  @Field(() => String, { nullable: true })
  guestUsername?: string;

  @Field(() => ChallengeInput, { nullable: true })
  challenge?: ChallengeInput;

  @Field()
  itemID!: string;

  @Field(() => CommentItemType)
  itemType!: CommentItemType;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => GraphQLRichText)
  text!: Descendant[];
}

@ArgsType()
export class UpdateUserCommentInput {
  @Field()
  id!: string;

  @Field(() => GraphQLRichText, { nullable: true })
  text?: Descendant[];

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  lead?: string;
}
