import CommentRating from '~/sdk/wep/models/comment/CommentRating'

export default class CommentRatings {
  public commentRatings: CommentRating[]

  constructor() {
    this.commentRatings = []
  }

  public parse(
    userRatings: CommentRating[] | CommentRatings | undefined
  ): CommentRatings | undefined {
    if (!userRatings) {
      return undefined
    }
    if (userRatings instanceof CommentRatings) {
      this.commentRatings = userRatings.commentRatings
      return this
    }
    this.commentRatings = []
    for (const userRating of userRatings) {
      this.commentRatings.push(new CommentRating(userRating))
    }
    return this
  }
}
