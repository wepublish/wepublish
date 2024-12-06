import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasComment, HasOptionalComment} from './has-comment.model'
import {Comment} from '../comment.model'

@Resolver(() => HasOptionalComment)
@Resolver(() => HasComment)
export class HasCommentResolver {
  @ResolveField(() => Comment, {nullable: true})
  public comment(@Parent() {commentId}: HasOptionalComment | HasComment) {
    if (!commentId) {
      return null
    }

    return {
      __typename: 'Comment',
      id: commentId
    }
  }
}
