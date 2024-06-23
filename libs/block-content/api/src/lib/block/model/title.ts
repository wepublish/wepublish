import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class TitleBlock {
  @Field()
  type: BlockType = BlockType.Title

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string
}

@InputType()
export class TitleBlockInput extends OmitType(TitleBlock, [], InputType) {}
