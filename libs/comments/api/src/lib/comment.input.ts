import {Field, InputType} from '@nestjs/graphql'
import {CommentItemType} from './comment.model'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Node} from 'slate'
import {CommentItemType as PCommentItemType} from '@prisma/client'

@InputType()
export class ChallengeInput {
  @Field(() => String, {nullable: true})
  challengeID?: string

  @Field(() => String)
  challengeSolution!: string
}

@InputType()
export class CommentInput {
  @Field(() => String, {nullable: true})
  parentID?: string

  @Field(() => String, {nullable: true})
  guestUsername?: string

  @Field(() => ChallengeInput, {nullable: true})
  challenge?: ChallengeInput

  @Field(() => String)
  itemID!: string

  @Field(() => CommentItemType)
  itemType!: PCommentItemType

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => GraphQLRichText)
  text!: Node[]
}

@InputType()
export class CommentUpdateInput {
  @Field(() => String)
  id!: string

  @Field(() => GraphQLRichText, {nullable: true})
  text?: Node[]

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string
}
