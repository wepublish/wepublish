import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'

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
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => CommentBlockFilter)
  filter!: CommentBlockFilter

  @Field(() => [Comment])
  comments!: Comment[]
}

// Inputs

@InputType()
export class CommentBlockInputFilter extends CommentBlockFilter {}

@InputType()
export class CommentBlockInput extends OmitType(CommentBlock, ['comments', 'filter']) {
  @Field(() => CommentBlockInputFilter)
  filter!: CommentBlockInputFilter
}
