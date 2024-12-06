import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Comment} from '../comment.model'

@InterfaceType()
export abstract class HasOptionalComment {
  @Field(() => ID, {nullable: true})
  commentId?: string

  @Field(() => Comment, {nullable: true})
  comment?: Comment
}

@InterfaceType()
export abstract class HasComment {
  @Field(() => ID)
  commentId!: string

  @Field(() => Comment)
  comment!: Comment
}
