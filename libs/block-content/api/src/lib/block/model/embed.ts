import {Field, InputType, ObjectType, Int, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class EmbedBlock {
  @Field()
  type: BlockType = BlockType.Embed

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  url?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => Int, {nullable: true})
  width?: number

  @Field(() => Int, {nullable: true})
  height?: number

  @Field(() => String, {nullable: true})
  styleCustom?: string

  @Field(() => String, {nullable: true})
  sandbox?: string
}

@InputType()
export class EmbedBlockInput extends OmitType(EmbedBlock, [], InputType) {}
