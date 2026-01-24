import { Field, InputType } from '@nestjs/graphql';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { Descendant } from 'slate';
import { CommentItemType } from '@prisma/client';
import { ChallengeInput } from '@wepublish/challenge/api';

@InputType()
export class CommentInput {
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

@InputType()
export class CommentUpdateInput {
  @Field()
  id!: string;

  @Field(() => GraphQLRichText, { nullable: true })
  text?: Descendant[];

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  lead?: string;
}
