import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class InstagramPostBlock {
  @Field()
  type: BlockType = BlockType.InstagramPost

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  postID!: string
}

@InputType()
export class InstagramPostBlockInput extends OmitType(InstagramPostBlock, [], InputType) {}
