import {gql} from 'graphql-tag'

export interface PollExternalVoteProps {
  id: string
  answerId: string
  amount: number
}

export default class PollExternalVote {
  public id: string
  public answerId: string
  public amount: number

  constructor({id, answerId, amount}: PollExternalVoteProps) {
    this.id = id
    this.answerId = answerId
    this.amount = amount
  }

  public static pollExternalVoteFragment = gql`
    fragment pollExternalVote on PollExternalVote {
      amount
      answerId
      id
    }
  `
}
