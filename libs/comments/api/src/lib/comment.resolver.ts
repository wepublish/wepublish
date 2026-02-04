import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  Comment,
  CommentsForItemArgs,
  CommentRevision,
  PaginatedComments,
  CommentListArgs,
  UpdateUserCommentInput,
  AddUserCommentInput,
  UpdateCommentInput,
  CreateCommentInput,
} from './comment.model';
import { CommentService, DecoratedComment } from './comment.service';
import {
  Authenticated,
  CurrentUser,
  Public,
  RequestFingerprint,
  UserSession,
} from '@wepublish/authentication/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { CommentTagDataloader, Tag } from '@wepublish/tag/api';
import { CommentDataloaderService } from './comment-dataloader.service';
import { URLAdapter } from '@wepublish/nest-modules';
import { ArticleDataloaderService } from '@wepublish/article/api';
import { PageDataloaderService } from '@wepublish/page/api';
import {
  CommentRating,
  OverriddenRating,
} from './rating-system/rating-system.model';
import { forwardRef, Inject } from '@nestjs/common';
import {
  CanDeleteComments,
  CanGetComments,
  CanTakeActionOnComment,
  CanUpdateComments,
} from '@wepublish/permissions';
import { hasPermission, Permissions } from '@wepublish/permissions/api';
import { CommentRejectionReason, CommentState } from '@prisma/client';
import { GraphQLRichText } from '@wepublish/richtext/api';

@Resolver(() => Comment)
export class CommentResolver {
  constructor(
    private commentService: CommentService,
    private commentDataloader: CommentDataloaderService,
    private tagDataLoader: CommentTagDataloader,
    private imageDataloaderService: ImageDataloaderService,
    private urlAdapter: URLAdapter,
    @Inject(forwardRef(() => ArticleDataloaderService))
    private articleDataloader: ArticleDataloaderService,
    @Inject(forwardRef(() => PageDataloaderService))
    private pageDataloader: PageDataloaderService
  ) {}

  @Permissions(CanGetComments)
  @Query(() => PaginatedComments, {
    description: `Returns a paginated list of comments based on the filters given.`,
  })
  public comments(@Args() filter: CommentListArgs) {
    return this.commentService.getAdminCommennts(filter);
  }

  @Permissions(CanGetComments)
  @Query(() => Comment, {
    description: `Returns a comment by id.`,
  })
  async comment(@Args('id') id: string) {
    return this.commentService.getComment(id);
  }

  @Public()
  @Query(() => [Comment], {
    description: `Returns a sorted and nested list of comments for an item.`,
  })
  async commentsForItem(
    @Args() input: CommentsForItemArgs,
    @CurrentUser() session: UserSession | null
  ) {
    const publicFilter = {
      OR: [
        session?.user.id ? { userID: session?.user.id } : {},
        { state: CommentState.approved },
      ],
    };

    return this.commentService.getCommentsForItem(
      input,
      !hasPermission(CanGetComments, session?.roles ?? []) ? publicFilter : (
        undefined
      )
    );
  }

  @Public()
  @Mutation(() => Comment, {
    description: `Adds a new comment made by you.`,
  })
  async addUserComment(
    @Args() input: AddUserCommentInput,
    @CurrentUser() session?: UserSession | null
  ) {
    return await this.commentService.addUserComment(input, session);
  }

  @Authenticated()
  @Mutation(() => Comment, {
    description: `Updates a comment you made.`,
  })
  async updateUserComment(
    @Args() input: UpdateUserCommentInput,
    @CurrentUser() session: UserSession
  ) {
    return this.commentService.updateUserComment(input, session);
  }

  @Permissions(CanUpdateComments)
  @Mutation(() => Comment, {
    description: `Creates a comment for any user`,
  })
  async createComment(@Args() input: CreateCommentInput) {
    return this.commentService.createAdminComment(input);
  }

  @Permissions(CanUpdateComments)
  @Mutation(() => Comment, {
    description: `Update any existing comment`,
  })
  async updateComment(@Args() input: UpdateCommentInput) {
    return this.commentService.updateAdminComment(input);
  }

  @Public()
  @Mutation(() => Comment, {
    description: `This mutation allows to rate a comment. Supports logged in and anonymous`,
  })
  async rateComment(
    @Args('commentId') commentId: string,
    @Args('answerId') answerId: string,
    @Args('value', { type: () => Int }) value: number,
    @CurrentUser() session: UserSession | null,
    @RequestFingerprint() fingerprint: string
  ) {
    return this.commentService.rateComment(
      commentId,
      answerId,
      value,
      fingerprint,
      session
    );
  }

  @Permissions(CanDeleteComments)
  @Mutation(() => Comment, {
    description: `Deletes a comment`,
  })
  async deleteComment(@Args('id') id: string) {
    return this.commentService.deleteComment(id);
  }

  @Permissions(CanTakeActionOnComment)
  @Mutation(() => Comment, {
    description: `Approves a comment`,
  })
  async approveComment(@Args('id') id: string) {
    return this.commentService.takeActionOnComment(id, {
      state: CommentState.approved,
      rejectionReason: null,
    });
  }

  @Permissions(CanTakeActionOnComment)
  @Mutation(() => Comment, {
    description: `Rejects a comment`,
  })
  async rejectComment(
    @Args('id') id: string,
    @Args('rejectionReason') rejectionReason: CommentRejectionReason
  ) {
    return this.commentService.takeActionOnComment(id, {
      state: CommentState.rejected,
      rejectionReason,
    });
  }

  @Permissions(CanTakeActionOnComment)
  @Mutation(() => Comment, {
    description: `Requests the user to change the comment's content`,
  })
  async requestChangesOnComment(
    @Args('id') id: string,
    @Args('rejectionReason') rejectionReason: CommentRejectionReason
  ) {
    return this.commentService.takeActionOnComment(id, {
      state: CommentState.pendingUserChanges,
      rejectionReason,
    });
  }

  @ResolveField(() => [CommentRevision])
  async revisions(
    @Parent() comment: DecoratedComment,
    @CurrentUser() session?: UserSession
  ) {
    const revisions = comment.revisions ?? [];

    if (hasPermission(CanGetComments, session?.roles ?? [])) {
      return revisions;
    }

    return revisions.length ? [revisions.at(-1)] : [];
  }
  @ResolveField(() => String)
  async title(@Parent() comment: DecoratedComment) {
    const revisions = comment.revisions ?? [];

    return revisions.at(-1)?.title;
  }
  @ResolveField(() => String)
  async lead(@Parent() comment: DecoratedComment) {
    const revisions = comment.revisions ?? [];

    return revisions.at(-1)?.lead;
  }
  @ResolveField(() => GraphQLRichText)
  async text(@Parent() comment: DecoratedComment) {
    const revisions = comment.revisions ?? [];

    return revisions.at(-1)?.text;
  }

  @ResolveField(() => [CommentRating])
  async calculatedRatings(@Parent() comment: DecoratedComment) {
    return comment.calculatedRatings;
  }

  @ResolveField(() => [CommentRating])
  async userRatings(
    @Parent() comment: DecoratedComment,
    @CurrentUser() session?: UserSession
  ) {
    const userId = session?.user?.id;

    if (!userId) {
      return [];
    }

    return comment.ratings.filter(rating => rating.userId === userId);
  }

  @ResolveField(() => [OverriddenRating])
  async overriddenRatings(
    @Parent() comment: DecoratedComment,
    @CurrentUser() session?: UserSession
  ) {
    if (!hasPermission(CanGetComments, session?.roles ?? [])) {
      return [];
    }

    return comment.overriddenRatings;
  }

  @ResolveField(() => Image, { nullable: true })
  async guestUserImage(@Parent() comment: DecoratedComment) {
    if (!comment.guestUserImageID) {
      return null;
    }

    return this.imageDataloaderService.load(comment.guestUserImageID);
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() comment: DecoratedComment) {
    return this.tagDataLoader.load(comment.id);
  }

  @ResolveField(() => Comment, { nullable: true })
  async url(@Parent() comment: DecoratedComment) {
    let item;
    if (comment.itemType === 'article') {
      item = await this.articleDataloader.load(comment.itemID);
    }

    if (comment.itemType === 'page') {
      item = await this.pageDataloader.load(comment.itemID);
    }

    if (!item) {
      return null;
    }

    return this.urlAdapter.getCommentURL(item, comment);
  }

  @ResolveField(() => Comment, { nullable: true })
  async parentComment(@Parent() comment: DecoratedComment) {
    if (!comment.parentID) {
      return null;
    }

    return this.commentDataloader.load(comment.parentID);
  }

  @ResolveField(() => [Comment])
  async children(@Parent() comment: DecoratedComment) {
    return comment.children;
  }
}
