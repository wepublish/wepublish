import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class HTMLBlock {
  @Field()
  type: BlockType = BlockType.HTML

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  html?: string
}

@InputType()
export class HTMLBlockInput extends OmitType(HTMLBlock, [], InputType) {}
