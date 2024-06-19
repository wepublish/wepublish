import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

// Objects

@ObjectType()
export class CommentBlockFilter {
  @Field(() => ID, {nullable: true})
  item?: string

  @Field(() => [ID], {nullable: true})
  tags?: string[]

  @Field(() => [ID], {nullable: true})
  comments?: string[]
}

@ObjectType()
export class CommentBlock {
  @Field()
  type: BlockType = BlockType.Comment

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => CommentBlockFilter)
  filter!: CommentBlockFilter

  // @Field(() => [Comment])
  // comments!: Comment[]
}

// Inputs

@InputType()
export class CommentBlockInputFilter extends OmitType(CommentBlockFilter, [], InputType) {}

@InputType()
export class CommentBlockInput extends OmitType(CommentBlock, ['filter'], InputType) {
  @Field(() => CommentBlockInputFilter)
  filter!: CommentBlockInputFilter
}
