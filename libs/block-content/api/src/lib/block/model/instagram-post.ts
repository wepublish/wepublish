import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class InstagramPostBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  postID!: string
}

@InputType()
export class InstagramPostBlockInput extends InstagramPostBlock {}
