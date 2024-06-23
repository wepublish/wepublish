import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class TwitterTweetBlock {
  @Field()
  type: BlockType = BlockType.TwitterTweet

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  tweetID!: string
}

@InputType()
export class TwitterTweetBlockInput extends OmitType(TwitterTweetBlock, [], InputType) {}
