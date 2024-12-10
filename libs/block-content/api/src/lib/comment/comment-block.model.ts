import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {Comment} from '@wepublish/comments/api'

@ObjectType()
export class CommentBlockFilter {
  @Field()
  item!: string

  @Field(() => [ID])
  tags!: string[]

  @Field(() => [ID])
  comments!: string[]
}

@InputType()
export class CommentBlockFilterInput extends OmitType(CommentBlockFilter, [] as const, InputType) {}

@ObjectType({
  implements: BaseBlock
})
export class CommentBlock extends BaseBlock<typeof BlockType.HTML> {
  @Field(() => CommentBlockFilter)
  filter!: CommentBlockFilter

  @Field(() => [Comment])
  comments!: Comment[]
}

@InputType()
export class CommentBlockInput {
  @Field(() => CommentBlockFilterInput)
  filter!: CommentBlockFilterInput
}
