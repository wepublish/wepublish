import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasPeer} from './has-peer.model'
import {Peer} from '../peer.model'

@Resolver(() => HasPeer)
export class HasPeerResolver {
  @ResolveField(() => Peer, {nullable: true})
  public peer(@Parent() block: HasPeer) {
    const {peerID} = block

    if (!peerID) {
      return null
    }

    return {__typename: 'Peer', id: peerID}
  }
}
