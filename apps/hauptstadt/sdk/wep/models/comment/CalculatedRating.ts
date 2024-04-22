import {gql} from 'graphql-tag'
import CommentRatingSystemAnswer from '~/sdk/wep/models/comment/CommentRatingSystemAnswer'

export interface CalculatedRatingProps {
  answer?: CommentRatingSystemAnswer
  count: number
  mean: number
  total: number
}

export default class CalculatedRating {
  public answer?: CommentRatingSystemAnswer
  public count: number
  public mean: number
  public total: number
  public userRate?: number

  constructor({answer, count, mean, total}: CalculatedRatingProps) {
    this.answer = answer ? new CommentRatingSystemAnswer(answer) : undefined
    this.count = count
    this.mean = mean
    this.total = total
  }

  public static calculatedRatingFragment = gql`
    fragment calculatedRating on CalculatedRating {
      count
      mean
      total
      answer {
        ...commentRatingSystemAnswer
      }
    }
    ${CommentRatingSystemAnswer.commentRatingSystemAnswerFragment}
  `
}
