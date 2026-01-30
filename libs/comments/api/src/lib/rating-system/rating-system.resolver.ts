import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { RatingSystemService } from './rating-system.service';
import {
  CommentRatingSystem,
  CommentRatingSystemAnswer,
  CreateCommentRatingSystemAnswerInput,
  UpdateCommentRatingSystemInput,
} from './rating-system.model';
import { Permissions } from '@wepublish/permissions/api';
import { CanUpdateCommentRatingSystem } from '@wepublish/permissions';

@Resolver(() => CommentRatingSystem)
export class RatingSystemResolver {
  constructor(private ratingSystemService: RatingSystemService) {}

  @Public()
  @Query(() => CommentRatingSystem, {
    description: 'This query returns the comment rating system.',
  })
  async ratingSystem() {
    return this.ratingSystemService.getRatingSystem();
  }

  @Permissions(CanUpdateCommentRatingSystem)
  @Mutation(() => CommentRatingSystem, {
    description: 'Update the comment rating system.',
  })
  async updateRatingSystem(@Args() input: UpdateCommentRatingSystemInput) {
    return this.ratingSystemService.updateRatingSystem(input);
  }

  @Permissions(CanUpdateCommentRatingSystem)
  @Mutation(() => CommentRatingSystemAnswer, {
    description: 'Creates a rating system answer.',
  })
  async createRatingSystemAnswer(
    @Args() input: CreateCommentRatingSystemAnswerInput
  ) {
    return this.ratingSystemService.createRatingSystemAnswer(input);
  }

  @Permissions(CanUpdateCommentRatingSystem)
  @Mutation(() => CommentRatingSystemAnswer, {
    description: 'Deletes a rating system answer.',
  })
  async deleteRatingSystemAnswer(@Args('id') id: string) {
    return this.ratingSystemService.deleteRatingSystemAnswer(id);
  }
}
