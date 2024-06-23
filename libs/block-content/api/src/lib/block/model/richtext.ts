import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Node} from 'slate'
import {BlockType} from '../block-type'

@ObjectType()
export class RichTextBlock {
  @Field()
  type: BlockType = BlockType.RichText

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => GraphQLRichText)
  richText!: Node[]
}

@InputType()
export class RichTextBlockInput extends OmitType(RichTextBlock, [], InputType) {}
