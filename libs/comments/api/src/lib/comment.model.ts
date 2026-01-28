import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Tag } from '@wepublish/tag/api';
import { Image } from '@wepublish/image/api';
import { Descendant } from 'slate';
import { GraphQLRichText } from '@wepublish/richtext/api';
import {
  OverriddenRating,
  CalculatedRating,
  CommentRating,
} from './rating-system/rating-system.model';
import { CommentItemType, CommentState } from '@prisma/client';
import { HasOptionalUser } from '@wepublish/user/api';

export enum CommentAuthorType {
  author = 'author',
  team = 'team',
  verifiedUser = 'verifiedUser',
  guestUser = 'guestUser',
}

registerEnumType(CommentAuthorType, {
  name: 'CommentAuthorType',
});

registerEnumType(CommentItemType, {
  name: 'CommentItemType',
});

registerEnumType(CommentState, {
  name: 'CommentState',
});

export enum CommentSort {
  rating = 'rating',
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

  @Field(() => String, { nullable: true })
  text?: string;

  @Field(() => Date)
  createdAt!: Date;
}

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

  @Field(() => [Tag])
  tags!: Tag[];

  @Field(() => CommentAuthorType)
  authorType!: CommentAuthorType;

  @Field()
  itemID!: string;

  @Field(() => CommentItemType)
  itemType!: CommentItemType;

  @Field(() => String, { nullable: true })
  source?: string;

  @Field(() => CommentState)
  state!: CommentState;

  @Field(() => String, { nullable: true })
  rejectionReason?: string;

  @Field(() => Boolean, { nullable: true })
  featured?: boolean;

  @Field(() => [OverriddenRating])
  overriddenRatings!: OverriddenRating[];

  @Field(() => [Comment])
  children!: Comment[];

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  lead?: string;

  @Field(() => GraphQLRichText, { nullable: true })
  text?: Descendant[];

  @Field()
  url?: string;

  @Field(() => [CalculatedRating])
  calculatedRatings!: CalculatedRating[];

  @Field(() => [CommentRating])
  userRatings!: CommentRating[];
}
