import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import {
  UpsertPeerProfileInput,
  PeerProfile,
  RemotePeerProfile,
} from './peer-profile.model';
import { PeerProfileService } from './peer-profile.service';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { forwardRef, Inject } from '@nestjs/common';
import { PEER_MODULE_OPTIONS, PeerModuleOptions } from './peer.constants';
import { PeerProfile as PPeerProfile } from '@prisma/client';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreatePeer, CanUpdatePeerProfile } from '@wepublish/permissions';

@Resolver(() => PeerProfile)
export class PeerProfileResolver {
  constructor(
    private peerProfileService: PeerProfileService,
    @Inject(forwardRef(() => ImageDataloaderService))
    private imageDataloaderService: ImageDataloaderService,
    @Inject(PEER_MODULE_OPTIONS) private options: PeerModuleOptions
  ) {}

  @Public()
  @Query(() => PeerProfile, {
    description: 'This query returns the peer profile.',
  })
  async peerProfile() {
    return this.peerProfileService.getPeerProfile();
  }

  @Permissions(CanCreatePeer)
  @Query(() => RemotePeerProfile, {
    description:
      'Returns a remote peer profile based on hostURL and token supplied.',
  })
  async remotePeerProfile(
    @Args('hostURL') hostURL: string,
    @Args('token') token: string
  ) {
    return this.peerProfileService.getRemotePeerProfile(hostURL, token);
  }

  @Permissions(CanUpdatePeerProfile)
  @Mutation(returns => PeerProfile, {
    description: `Updates the peer profile of the current media.`,
  })
  public updatePeerProfile(@Args() peerProfile: UpsertPeerProfileInput) {
    return this.peerProfileService.upsertPeerProfile(peerProfile);
  }

  @ResolveField(() => Image, { nullable: true })
  async logo(@Parent() profile: PPeerProfile) {
    if (!profile.logoID) {
      return null;
    }

    return this.imageDataloaderService.load(profile.logoID);
  }

  @ResolveField(() => Image, { nullable: true })
  async squareLogo(@Parent() profile: PPeerProfile) {
    if (!profile.squareLogoId) {
      return null;
    }

    return this.imageDataloaderService.load(profile.squareLogoId);
  }

  @ResolveField(() => Image, { nullable: true })
  async callToActionImage(@Parent() profile: PPeerProfile) {
    if (!profile.callToActionImageID) {
      return null;
    }

    return this.imageDataloaderService.load(profile.callToActionImageID);
  }

  @ResolveField(() => String)
  async hostURL() {
    return this.options.hostURL;
  }

  @ResolveField(() => String)
  async websiteURL() {
    return this.options.websiteURL;
  }
}
