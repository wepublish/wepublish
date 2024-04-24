import {gql} from 'graphql-tag'
import Block from '~/sdk/wep/models/block/Block'
import Poll from '~/sdk/wep/models/poll/Poll'

export default class PollBlock extends Block {
  public poll?: Poll

  constructor({__typename, poll}: PollBlock) {
    super({__typename})
    this.poll = poll ? new Poll(poll) : undefined
  }

  public static pollBlockFragment = gql`
    fragment pollBlock on PollBlock {
      poll {
        ...pollFragment
      }
    }
    ${Poll.pollFragment}
  `
}
