import {Query, Resolver} from '@nestjs/graphql'
import {Public} from '@wepublish/authentication/api'
import {FullCommentRatingSystem} from '../comment.model'
import {RatingSystemService} from './rating-system.service'

@Resolver(() => FullCommentRatingSystem)
export class RatingSystemResolver {
  constructor(private ratingSystemService: RatingSystemService) {}

  @Public()
  @Query(() => FullCommentRatingSystem, {
    description: 'This query returns the comment rating system.',
    nullable: true
  })
  async ratingSystem() {
    return this.ratingSystemService.getRatingSystem()
  }
}
