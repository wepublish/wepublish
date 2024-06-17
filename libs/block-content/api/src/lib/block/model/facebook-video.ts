import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class FacebookVideoBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  videoID!: string
}

@InputType()
export class FacebookVideoBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  videoID!: string
}
