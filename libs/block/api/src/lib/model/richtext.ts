import {Field, InputType, ObjectType} from '@nestjs/graphql'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Node} from 'slate'

@ObjectType()
export class RichTextBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => GraphQLRichText)
  richText!: Node[]
}

@InputType()
export class RichTextBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => GraphQLRichText)
  richText!: Node[]
}
