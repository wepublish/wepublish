import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class FacebookPostBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  postID!: string
}

@InputType()
export class FacebookPostBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  postID!: string
}
