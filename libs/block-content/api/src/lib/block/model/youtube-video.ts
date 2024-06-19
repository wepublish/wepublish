import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class YouTubeVideoBlock {
  @Field()
  type: BlockType = BlockType.YouTubeVideo

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  videoID!: string
}

@InputType()
export class YouTubeVideoBlockInput extends OmitType(YouTubeVideoBlock, [], InputType) {}
