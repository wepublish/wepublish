import PollExternalVote from '~/sdk/wep/models/poll/PollExternalVote'

export default class PollExternalVotes {
  public pollExternalVotes: PollExternalVote[]

  constructor() {
    this.pollExternalVotes = []
  }

  public parse(pollExternalVotes: PollExternalVote[]): PollExternalVotes {
    this.pollExternalVotes = []
    for (const rawVote of pollExternalVotes) {
      this.pollExternalVotes.push(new PollExternalVote(rawVote))
    }
    return this
  }

  public getTotalVotes(): number {
    return this.pollExternalVotes.reduce((total, vote) => total + vote.amount, 0) || 0
  }

  public getTotalVotesByAnswerId(answerId: string): number {
    return (
      this.pollExternalVotes
        .filter(externalVote => externalVote.answerId === answerId)
        .reduce((total, externalVote) => total + externalVote.amount, 0) || 0
    )
  }
}
