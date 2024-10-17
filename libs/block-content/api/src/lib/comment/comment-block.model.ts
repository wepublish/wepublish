import {Field, ID, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {Comment} from '@wepublish/comments/api'

@ObjectType()
export class CommentBlockFilter {
  @Field(() => ID)
  item!: string

  @Field(() => [ID])
  tags!: string[]

  @Field(() => [ID])
  comments!: string[]
}

@ObjectType({
  implements: BaseBlock
})
export class CommentBlock extends BaseBlock<typeof BlockType.HTML> {
  @Field(() => CommentBlockFilter)
  filter!: CommentBlockFilter

  @Field(() => [Comment])
  comments!: Comment[]
}
