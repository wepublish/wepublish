import {Args, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {Public} from '@wepublish/authentication/api'
import {GraphQLSlug} from '@wepublish/utils/api'
import {Peer} from './peer.model'
import {PeerService} from './peer.service'
import {PeerProfile} from './peer-profile.model'
import {PeerProfileService} from './peer-profile.service'

@Resolver(() => Peer)
export class PeerResolver {
  constructor(private peerService: PeerService, private peerProfileService: PeerProfileService) {}

  @Public()
  @Query(() => Peer, {
    nullable: true,
    description: 'This query takes either the ID or the slug and returns the peer profile.'
  })
  async peer(
    @Args('id', {nullable: true}) id?: string,
    @Args('slug', {type: () => GraphQLSlug, nullable: true}) slug?: string
  ): Promise<Peer | null> {
    return this.peerService.getPeerByIdOrSlug(id, slug)
  }

  @ResolveField(() => PeerProfile, {nullable: true})
  async profile(@Parent() peer: Peer): Promise<PeerProfile | null> {
    // For federated peers, we might need to fetch the profile from their API
    // This is a simplified implementation that returns our own profile
    if (peer.hostURL.includes('localhost') || peer.hostURL.includes('127.0.0.1')) {
      return this.peerProfileService.getPeerProfile()
    }

    // For remote peers, you would implement the federation logic here
    // This would involve making a request to the peer's API
    // For now, we'll return null for remote peers
    return null
  }
}
