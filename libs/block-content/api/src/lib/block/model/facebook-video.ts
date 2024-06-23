import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class FacebookVideoBlock {
  @Field()
  type: BlockType = BlockType.FacebookVideo

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  userID!: string

  @Field(() => String)
  videoID!: string
}

@InputType()
export class FacebookVideoBlockInput extends OmitType(FacebookVideoBlock, [], InputType) {}
