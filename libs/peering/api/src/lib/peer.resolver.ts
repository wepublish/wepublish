import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CurrentUser,
  Public,
  UserSession,
} from '@wepublish/authentication/api';
import { CreatePeerInput, Peer, UpdatePeerInput } from './peer.model';
import { PeerService } from './peer.service';
import { RemotePeerProfile } from './peer-profile.model';
import { PeerProfileService } from './peer-profile.service';
import { hasPermission, Permissions } from '@wepublish/permissions/api';
import {
  CanCreatePeer,
  CanDeletePeer,
  CanGetPeer,
  CanGetPeers,
} from '@wepublish/permissions';

@Resolver(() => Peer)
export class PeerResolver {
  constructor(
    private peerService: PeerService,
    private peerProfileService: PeerProfileService
  ) {}

  @Public()
  @Query(() => Peer, {
    nullable: true,
    description:
      'This query takes either the ID or the slug and returns the peer profile.',
  })
  async peer(
    @Args('id', { nullable: true }) id?: string,
    @Args('slug', { nullable: true }) slug?: string
  ) {
    return this.peerService.getPeerByIdOrSlug(id, slug);
  }

  @Permissions(CanGetPeers)
  @Query(() => [Peer], {
    description: `Returns a list of all peers.`,
  })
  public peers() {
    return this.peerService.getPeers();
  }

  @Permissions(CanCreatePeer)
  @Mutation(returns => Peer, { description: `Creates a new peer.` })
  public createPeer(@Args() peer: CreatePeerInput) {
    return this.peerService.createPeer(peer);
  }

  @Permissions(CanCreatePeer)
  @Mutation(returns => Peer, { description: `Updates an existing peer.` })
  public updatePeer(@Args() peer: UpdatePeerInput) {
    return this.peerService.updatePeer(peer);
  }

  @Permissions(CanDeletePeer)
  @Mutation(returns => Peer, { description: `Deletes an existing peer.` })
  public deletePeer(@Args('id') id: string) {
    return this.peerService.deletePeer(id);
  }

  @ResolveField(() => RemotePeerProfile, { nullable: true })
  async profile(@Parent() peer: Peer): Promise<RemotePeerProfile | null> {
    return this.peerProfileService.getRemotePeerProfile(peer.id);
  }

  @ResolveField(() => String)
  public async token(
    @CurrentUser() user: UserSession | undefined,
    @Parent() { token }: Peer
  ) {
    if (hasPermission(CanGetPeer, user?.roles ?? [])) {
      return token;
    }

    return '';
  }
}
