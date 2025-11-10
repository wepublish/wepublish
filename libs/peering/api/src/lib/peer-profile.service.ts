import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PeerProfile, RemotePeerProfile } from './peer-profile.model';
import { Image } from '@wepublish/image/api';
import { PEER_MODULE_OPTIONS, PeerModuleOptions } from './peer.constants';
import { Descendant } from 'slate';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RemotePeerProfileDataloaderService } from './remote-peer-profile.dataloader';
import { Cache } from 'cache-manager';

@Injectable()
export class PeerProfileService {
  constructor(
    private prisma: PrismaClient,
    private peerProfile: RemotePeerProfileDataloaderService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(PEER_MODULE_OPTIONS) private options: PeerModuleOptions
  ) {}

  async getPeerProfile(): Promise<PeerProfile> {
    const { hostURL, websiteURL } = this.options;

    // @TODO: move fallback to seed
    const profile = (await this.prisma.peerProfile.findFirst({})) ?? {
      name: '',
      themeColor: '#000000',
      themeFontColor: '#ffffff',
      callToActionURL: '',
      callToActionText: [],
      logoID: null,
      squareLogoId: null,
      callToActionImageID: null,
      callToActionImageURL: '',
    };

    let logo: Image | undefined = undefined;
    let squareLogo: Image | undefined = undefined;
    let callToActionImage: Image | undefined = undefined;

    if (profile.logoID) {
      logo = { id: profile.logoID } as Image;
    }

    if (profile.squareLogoId) {
      squareLogo = { id: profile.squareLogoId } as Image;
    }

    if (profile.callToActionImageID) {
      callToActionImage = { id: profile.callToActionImageID } as Image;
    }

    return {
      name: profile.name,
      themeColor: profile.themeColor,
      themeFontColor: profile.themeFontColor,
      callToActionText: profile.callToActionText as Descendant[],
      callToActionURL: profile.callToActionURL,
      callToActionImageURL: profile.callToActionImageURL ?? undefined,
      logoID: profile.logoID ?? undefined,
      squareLogoId: profile.squareLogoId ?? undefined,
      callToActionImageID: profile.callToActionImageID ?? undefined,
      hostURL,
      websiteURL,
      logo,
      squareLogo,
      callToActionImage,
    };
  }

  async getRemotePeerProfile(peerId: string) {
    const key = `REMOTE-PEER-PROFILE:${peerId}`;
    const cached = await this.cacheManager.get<RemotePeerProfile>(key);

    if (cached) {
      return cached;
    }

    const profile = await this.peerProfile.load(peerId);

    if (process.env['NODE_ENV'] === 'production' && profile) {
      await this.cacheManager.set(key, profile, 1000 * 3600 * 24);
    }

    return profile;
  }
}
