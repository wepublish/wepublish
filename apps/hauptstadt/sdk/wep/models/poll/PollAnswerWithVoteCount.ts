import {gql} from 'graphql-tag'

export interface PollAnswerWithVoteCountProps {
  id: string
  pollId: string
  answer: string
  votes: number
}

export default class PollAnswerWithVoteCount {
  public id: string
  public pollId: string
  public answer: string
  votes: number

  constructor({id, pollId, answer, votes}: PollAnswerWithVoteCountProps) {
    this.id = id
    this.pollId = pollId
    this.answer = answer
    this.votes = votes
  }

  public static pollAnswerWithVoteCountFragment = gql`
    fragment pollAnswerWithVoteCount on PollAnswerWithVoteCount {
      answer
      id
      pollId
      votes
    }
  `
}
