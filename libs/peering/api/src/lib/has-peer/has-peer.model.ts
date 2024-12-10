import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Peer} from '../peer.model'

@InterfaceType()
export abstract class HasPeer {
  @Field({nullable: true})
  peerID?: string

  @Field(() => Peer, {nullable: true})
  peer?: Peer
}
