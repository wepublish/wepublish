import CalculatedRating from '~/sdk/wep/models/comment/CalculatedRating'

export default class CalculatedRatings {
  public calculatedRatings: CalculatedRating[]

  constructor() {
    this.calculatedRatings = []
  }

  public parse(
    ratings: CalculatedRating[] | CalculatedRatings | undefined
  ): CalculatedRatings | undefined {
    if (!ratings) {
      return undefined
    }
    if (ratings instanceof CalculatedRatings) {
      this.calculatedRatings = ratings.calculatedRatings
      return this
    }

    this.calculatedRatings = []
    for (const rating of ratings) {
      this.calculatedRatings.push(new CalculatedRating(rating))
    }
    return this
  }

  public getTotalRating(): number {
    let totalRating = 0
    for (const rating of this.calculatedRatings) {
      totalRating += rating.total
    }
    return totalRating
  }
}
