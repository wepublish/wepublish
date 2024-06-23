import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class VimeoVideoBlock {
  @Field()
  type: BlockType = BlockType.VimeoVideo

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  videoID!: string
}

@InputType()
export class VimeoVideoBlockInput extends OmitType(VimeoVideoBlock, [], InputType) {}
