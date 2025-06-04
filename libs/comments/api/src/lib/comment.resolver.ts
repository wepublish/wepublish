import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {Comment, CommentRating, FullCommentRatingSystem, PublicCommentSort} from './comment.model'
import {CommentService} from './comment.service'
import {SortOrder} from '@wepublish/utils/api'
import {
  Authenticated,
  CurrentUser,
  Public,
  RequestFingerprint,
  UserSession
} from '@wepublish/authentication/api'
import {Image} from '@wepublish/image/api'
import {User} from '@wepublish/user/api'
import {Tag, TagService} from '@wepublish/tag/api'
import {CommentDataloaderService} from './comment-dataloader.service'
import {RatingSystemService} from './rating-system'
import {CommentInput, CommentUpdateInput} from './comment.input'
import {PrismaService} from '@wepublish/nest-modules'

@Resolver(() => Comment)
export class CommentResolver {
  constructor(
    private readonly commentService: CommentService,
    private readonly commentDataloader: CommentDataloaderService,
    private readonly tagService: TagService,
    private readonly ratingSystemService: RatingSystemService
  ) {}

  @Query(() => [Comment], {
    description: 'This query returns the comments of an item.'
  })
  @Public()
  async comments(
    @Args('itemId') itemId: string,
    @Args('sort', {nullable: true}) sort?: PublicCommentSort,
    @Args('order', {nullable: true, defaultValue: SortOrder.Descending}) order?: SortOrder,
    @CurrentUser() session?: UserSession | null
  ) {
    const userId = session?.user?.id || null
    return this.commentService.getPublicCommentsForItemById(
      itemId,
      userId,
      sort || null,
      order || SortOrder.Descending
    )
  }

  @Public()
  @Mutation(() => Comment, {
    description: `Create a new comment`
  })
  async addComment(
    @Args('input') input: CommentInput,
    @CurrentUser() session?: UserSession | null
  ) {
    return await this.commentService.addPublicComment(input, session)
  }

  @Authenticated()
  @Mutation(() => Comment, {
    description: `Update an existing comment`
  })
  async updateComment(
    @Args('input') input: CommentUpdateInput,
    @CurrentUser() session: UserSession
  ) {
    return this.commentService.updatePublicComment(input, session)
  }

  @Query(() => FullCommentRatingSystem)
  @Public()
  async ratingSystem() {
    return this.ratingSystemService.getRatingSystem()
  }

  @Public()
  @Mutation(() => Comment, {
    description: `This mutation allows to rate a comment. Supports logged in and anonymous`
  })
  async rateComment(
    @Args('commentId') commentId: string,
    @Args('answerId') answerId: string,
    @Args('value') value: number,
    @CurrentUser() session: UserSession | null,
    @RequestFingerprint() fingerprint: string
  ) {
    return this.commentService.rateComment(commentId, answerId, value, fingerprint, session)
  }

  @ResolveField(() => [CommentRating])
  @Public()
  async userRatings(@Parent() comment: Comment, @CurrentUser() session?: UserSession | null) {
    const userId = session?.user?.id || null
    return this.ratingSystemService.getUserCommentRatings(comment.id, userId)
  }

  @ResolveField(() => Image, {nullable: true})
  async guestUserImage(@Parent() comment: Comment) {
    if (!comment.guestUserImageID) {
      return null
    }
    return {id: comment.guestUserImageID}
  }

  @ResolveField(() => User, {nullable: true})
  async user(@Parent() comment: Comment) {
    if (!comment.userID) {
      return null
    }
    return {id: comment.userID}
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() comment: Comment) {
    return this.tagService.getTagsByCommentId(comment.id)
  }

  @ResolveField(() => Comment, {nullable: true})
  async parentComment(@Parent() comment: Comment) {
    if (!comment.parentID) {
      return null
    }
    return this.commentDataloader.load(comment.parentID)
  }

  @ResolveField(() => [Comment])
  @Public()
  async children(@Parent() comment: Comment, @CurrentUser() session?: UserSession | null) {
    const userId = session?.user?.id || null
    return this.commentService.getPublicChildrenCommentsByParentId(comment.id, userId)
  }
}
