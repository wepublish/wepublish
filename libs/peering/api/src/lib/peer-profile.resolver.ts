import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { PeerProfile } from './peer-profile.model';
import { PeerProfileService } from './peer-profile.service';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { forwardRef, Inject } from '@nestjs/common';

@Resolver(() => PeerProfile)
export class PeerProfileResolver {
  constructor(
    private peerProfileService: PeerProfileService,
    @Inject(forwardRef(() => ImageDataloaderService))
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @Public()
  @Query(() => PeerProfile, {
    description: 'This query returns the peer profile.',
  })
  async peerProfile() {
    return this.peerProfileService.getPeerProfile();
  }

  @ResolveField(() => Image, { nullable: true })
  async logo(@Parent() profile: PeerProfile) {
    if (!profile.logoID) {
      return null;
    }

    return this.imageDataloaderService.load(profile.logoID);
  }

  @ResolveField(() => Image, { nullable: true })
  async squareLogo(@Parent() profile: PeerProfile) {
    if (!profile.squareLogoId) {
      return null;
    }

    return this.imageDataloaderService.load(profile.squareLogoId);
  }

  @ResolveField(() => Image, { nullable: true })
  async callToActionImage(@Parent() profile: PeerProfile) {
    if (!profile.callToActionImageID) {
      return null;
    }

    return this.imageDataloaderService.load(profile.callToActionImageID);
  }
}
