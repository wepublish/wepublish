import {Args, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {Public} from '@wepublish/authentication/api'
import {GraphQLSlug} from '@wepublish/utils/api'
import {Peer} from './peer.model'
import {PeerService} from './peer.service'
import {RemotePeerProfile} from './peer-profile.model'
import {PeerProfileService} from './peer-profile.service'

@Resolver(() => Peer)
export class PeerResolver {
  constructor(
    private peerService: PeerService,
    private peerProfileService: PeerProfileService
  ) {}

  @Public()
  @Query(() => Peer, {
    nullable: true,
    description: 'This query takes either the ID or the slug and returns the peer profile.'
  })
  async peer(
    @Args('id', {nullable: true}) id?: string,
    @Args('slug', {type: () => GraphQLSlug, nullable: true}) slug?: string
  ) {
    return this.peerService.getPeerByIdOrSlug(id, slug)
  }

  @ResolveField(() => RemotePeerProfile, {nullable: true})
  async profile(@Parent() peer: Peer): Promise<RemotePeerProfile | null> {
    return this.peerProfileService.getRemotePeerProfile(peer.id)
  }
}
