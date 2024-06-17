import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class TwitterTweetBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  tweetID!: string
}

@InputType()
export class TwitterTweetBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  tweetID!: string
}
