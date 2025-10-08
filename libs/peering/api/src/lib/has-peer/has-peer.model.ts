import { Field, InterfaceType } from '@nestjs/graphql';
import { Peer } from '../peer.model';

@InterfaceType()
export abstract class HasOptionalPeer {
  @Field({ nullable: true })
  peerID?: string;

  @Field(() => Peer, { nullable: true })
  peer?: Peer;
}

@InterfaceType()
export abstract class HasPeer {
  @Field()
  peerID!: string;

  @Field(() => Peer)
  peer!: Peer;
}

// New Style

@InterfaceType()
export abstract class HasPeerLc {
  @Field()
  peerId!: string;

  @Field(() => Peer)
  peer!: Peer;
}

@InterfaceType()
export abstract class HasOptionalPeerLc {
  @Field({ nullable: true })
  peerId?: string;

  @Field(() => Peer, { nullable: true })
  peer?: Peer;
}
