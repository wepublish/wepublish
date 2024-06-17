import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class TikTokVideoBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  videoID!: string

  @Field(() => String)
  userID!: string
}

@InputType()
export class TikTokVideoBlockInput extends TikTokVideoBlock {}
