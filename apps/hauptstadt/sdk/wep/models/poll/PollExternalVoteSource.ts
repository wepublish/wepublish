import {gql} from 'graphql-tag'
import PollExternalVotes from '~/sdk/wep/models/poll/PollExternalVotes'
import PollExternalVote from '~/sdk/wep/models/poll/PollExternalVote'

export interface PollExternalVoteSourceProps {
  id: string
  source: string
  voteAmounts?: PollExternalVotes
}

export default class PollExternalVoteSource {
  public id: string
  public source: string
  public voteAmounts?: PollExternalVotes

  constructor({id, source, voteAmounts}: PollExternalVoteSourceProps) {
    this.id = id
    this.source = source
    this.voteAmounts = voteAmounts
      ? new PollExternalVotes().parse(voteAmounts as unknown as PollExternalVote[])
      : undefined
  }

  public static pollExternalVoteSourceFragment = gql`
    fragment pollExternalVoteSource on PollExternalVoteSource {
      id
      source
      voteAmounts {
        ...pollExternalVote
      }
    }
    ${PollExternalVote.pollExternalVoteFragment}
  `
}
