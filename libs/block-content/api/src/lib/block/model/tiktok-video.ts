import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class TikTokVideoBlock {
  @Field()
  type: BlockType = BlockType.TikTokVideo

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  videoID!: string

  @Field(() => String)
  userID!: string
}

@InputType()
export class TikTokVideoBlockInput extends OmitType(TikTokVideoBlock, [], InputType) {}
