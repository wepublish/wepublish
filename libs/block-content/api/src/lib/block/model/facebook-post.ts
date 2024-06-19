import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class FacebookPostBlock {
  @Field()
  type: BlockType = BlockType.FacebookPost

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  postID!: string
}

@InputType()
export class FacebookPostBlockInput extends OmitType(FacebookPostBlock, [], InputType) {}
