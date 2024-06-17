import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class YouTubeVideoBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  videoID!: string
}

@InputType()
export class YouTubeVideoBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  videoID!: string
}
