import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasOptionalPeer,
  HasOptionalPeerLc,
  HasPeer,
  HasPeerLc,
} from './has-peer.model';
import { Peer } from '../peer.model';
import { PeerDataloaderService } from '../peer-dataloader.service';

@Resolver(() => HasPeer)
export class HasPeerResolver {
  constructor(private dataloader: PeerDataloaderService) {}

  @ResolveField(() => Peer, { nullable: true })
  public async peer(
    @Parent() block: HasOptionalPeer | HasPeer | HasOptionalPeerLc | HasPeerLc
  ) {
    const id =
      'peerId' in block ? block.peerId
      : 'peerID' in block ? block.peerID
      : null;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasPeerLc)
export class HasPeerLcResolver extends HasPeerResolver {}

@Resolver(() => HasOptionalPeer)
export class HasOptionalPeerResolver extends HasPeerResolver {}

@Resolver(() => HasOptionalPeerLc)
export class HasOptionalPeerLcResolver extends HasPeerResolver {}
