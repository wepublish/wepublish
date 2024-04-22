import moment, {Moment} from 'moment'
import {gql} from 'graphql-tag'
import CommentRatingSystemAnswer from '~/sdk/wep/models/comment/CommentRatingSystemAnswer'

export interface CommentRatingProps {
  id: string
  userId: string
  commentId: string
  value: number
  createdAt?: Moment
  disabled: boolean
  answer: CommentRatingSystemAnswer
}

export default class CommentRating {
  public id: string
  public userId: string
  public commentId: string
  public value: number
  public createdAt?: Moment
  public disabled: boolean
  public answer: CommentRatingSystemAnswer

  constructor({id, userId, commentId, value, createdAt, disabled, answer}: CommentRatingProps) {
    this.id = id
    this.userId = userId
    this.commentId = commentId
    this.value = value
    this.createdAt = createdAt ? moment(createdAt) : undefined
    this.disabled = disabled
    this.answer = new CommentRatingSystemAnswer(answer)
  }

  public static commentRatingFragment = gql`
    fragment commentRating on CommentRating {
      id
      userId
      commentId
      value
      createdAt
      fingerprint
      disabled
      answer {
        ...commentRatingSystemAnswer
      }
    }
    ${CommentRatingSystemAnswer.commentRatingSystemAnswerFragment}
  `
}
