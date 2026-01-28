import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class TwitterTweetBlock extends BaseBlock<
  typeof BlockType.TwitterTweet
> {
  @Field({ nullable: true })
  userID?: string;

  @Field({ nullable: true })
  tweetID?: string;
}

@InputType()
export class TwitterTweetBlockInput extends OmitType(
  TwitterTweetBlock,
  ['type'] as const,
  InputType
) {}
