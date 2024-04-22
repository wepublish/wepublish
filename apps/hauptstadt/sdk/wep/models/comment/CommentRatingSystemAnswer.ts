import {gql} from 'graphql-tag'

export type RatingSystemType = 'STAR'

export interface CommentRatingSystemAnswerProps {
  id: string
  answer: string
  ratingSystemId: string
  type: RatingSystemType
}

export default class CommentRatingSystemAnswer {
  public id: string
  public answer: string
  public ratingSystemId: string
  public type: RatingSystemType

  constructor({id, answer, ratingSystemId, type}: CommentRatingSystemAnswerProps) {
    this.id = id
    this.answer = answer
    this.ratingSystemId = ratingSystemId
    this.type = type
  }

  public static commentRatingSystemAnswerFragment = gql`
    fragment commentRatingSystemAnswer on CommentRatingSystemAnswer {
      id
      answer
      ratingSystemId
      type
    }
  `
}
