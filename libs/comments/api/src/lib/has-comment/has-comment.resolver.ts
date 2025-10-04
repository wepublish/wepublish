import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { HasComment, HasOptionalComment } from './has-comment.model';
import { Comment } from '../comment.model';
import { CommentDataloaderService } from '../comment-dataloader.service';

@Resolver(() => HasComment)
export class HasCommentResolver {
  constructor(private commentDataloaderService: CommentDataloaderService) {}

  @ResolveField(() => Comment, { nullable: true })
  public comment(@Parent() { commentId }: HasOptionalComment | HasComment) {
    if (!commentId) {
      return null;
    }
    return this.commentDataloaderService.load(commentId);
  }
}

@Resolver(() => HasOptionalComment)
export class HasOptionalCommentResolver extends HasCommentResolver {}
