import moment, {Moment} from 'moment'
import {gql} from 'graphql-tag'
import PollAnswerWithVoteCount from '~/sdk/wep/models/poll/PollAnswerWithVoteCount'
import PollAnswersWithVoteCount from '~/sdk/wep/models/poll/PollAnswersWithVoteCount'
import PollExternalVoteSource from '~/sdk/wep/models/poll/PollExternalVoteSource'
import PollExternalVoteSources from '~/sdk/wep/models/poll/PollExternalVoteSources'

export interface PollProps {
  id: string
  question: string
  opensAt?: Moment
  closedAt?: Moment
  answers?: PollAnswersWithVoteCount
  externalVoteSources?: PollExternalVoteSources
}

export default class Poll {
  public id: string
  public question: string
  public opensAt?: Moment
  public closedAt?: Moment
  public answers?: PollAnswersWithVoteCount
  public externalVoteSources?: PollExternalVoteSources

  constructor({id, question, opensAt, closedAt, answers, externalVoteSources}: PollProps) {
    this.id = id
    this.question = question
    this.opensAt = opensAt ? moment(opensAt) : undefined
    this.closedAt = closedAt ? moment(closedAt) : undefined
    this.answers = answers
      ? new PollAnswersWithVoteCount().parse(answers as unknown as PollAnswerWithVoteCount[])
      : undefined
    this.externalVoteSources = externalVoteSources
      ? new PollExternalVoteSources().parse(
          externalVoteSources as unknown as PollExternalVoteSource[]
        )
      : undefined
  }

  public getVotesPercentageByAnswerId(answerId: string): number {
    const votesTotal = this.getTotalVotes()
    const votesByAnswerId = this.getTotalVotesByAnswerId(answerId)
    return Math.round((votesByAnswerId * 100) / votesTotal)
  }

  public sortByBestVoted(): void {
    this.answers?.answers.sort((a, b) => {
      return this.getVotesPercentageByAnswerId(b.id) - this.getVotesPercentageByAnswerId(a.id)
    })
  }

  /**
   * Total votes by answer
   */
  public getTotalVotesByAnswerId(answerId: string): number {
    return (
      this.getTotalUserVotesByAnswerId(answerId) + this.getTotalExternalVotesByAnswerId(answerId)
    )
  }

  public getTotalUserVotesByAnswerId(answerId: string): number {
    return (
      this.answers?.answers
        .filter(answer => answer.id === answerId)
        .reduce((total, answer) => total + answer.votes, 0) || 0
    )
  }

  public getTotalExternalVotesByAnswerId(answerId: string): number {
    return (
      this.externalVoteSources?.pollExternalVoteSources.reduce(
        (total, voteSource) =>
          total + (voteSource.voteAmounts?.getTotalVotesByAnswerId(answerId) || 0),
        0
      ) || 0
    )
  }

  /**
   * Total votes over all
   */
  public getTotalVotes(): number {
    return this.getTotalUserVotes() + this.getTotalExternalVotes()
  }

  public getTotalUserVotes(): number {
    return this.answers?.answers.reduce((total, answer) => total + answer.votes, 0) || 0
  }

  public getTotalExternalVotes(): number {
    return (
      this.externalVoteSources?.pollExternalVoteSources.reduce((total, voteSource) => {
        return total + (voteSource.voteAmounts?.getTotalVotes() || 0)
      }, 0) || 0
    )
  }

  public static pollFragment = gql`
    fragment pollFragment on FullPoll {
      answers {
        ...pollAnswerWithVoteCount
      }
      closedAt
      externalVoteSources {
        ...pollExternalVoteSource
      }
      id
      opensAt
      question
    }
    ${PollAnswerWithVoteCount.pollAnswerWithVoteCountFragment}
    ${PollExternalVoteSource.pollExternalVoteSourceFragment}
  `
}
