import {Field, InputType} from '@nestjs/graphql'
import {CommentItemType} from './comment.model'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Descendant} from 'slate'
import {CommentItemType as PCommentItemType} from '@prisma/client'
import {ChallengeInput} from '@wepublish/challenge/api'

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
  text!: Descendant[]
}

@InputType()
export class CommentUpdateInput {
  @Field(() => String)
  id!: string

  @Field(() => GraphQLRichText, {nullable: true})
  text?: Descendant[]

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string
}
