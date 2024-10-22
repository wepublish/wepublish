import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Node} from 'slate'

@ObjectType({
  implements: BaseBlock
})
export class RichTextBlock extends BaseBlock<typeof BlockType.RichText> {
  @Field(() => GraphQLRichText)
  richText!: Node[]
}

@InputType()
export class RichTextBlockInput extends OmitType(RichTextBlock, [] as const, InputType) {}
