import PollExternalVoteSource from '~/sdk/wep/models/poll/PollExternalVoteSource'

export default class PollExternalVoteSources {
  public pollExternalVoteSources: PollExternalVoteSource[]

  constructor() {
    this.pollExternalVoteSources = []
  }

  parse(pollExternalVoteSources: PollExternalVoteSource[]): PollExternalVoteSources {
    this.pollExternalVoteSources = []
    for (const rawSource of pollExternalVoteSources) {
      this.pollExternalVoteSources.push(new PollExternalVoteSource(rawSource))
    }
    return this
  }
}
