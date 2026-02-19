import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  UpsertPeerProfileInput,
  RemotePeerProfile,
} from './peer-profile.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createSafeHostUrl } from './create-safe-host-url';
import { GraphQLClient } from 'graphql-request';
import {
  PeerProfile as RemoteGqlPeerProfile,
  PeerProfileQuery,
  PeerProfileQueryVariables,
} from './remote/graphql';
import { PeerDataloaderService } from './peer-dataloader.service';

@Injectable()
export class PeerProfileService {
  constructor(
    private prisma: PrismaClient,
    protected peer: PeerDataloaderService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getPeerProfile() {
    // @TODO: move fallback to seed
    const profile = (await this.prisma.peerProfile.findFirst({})) ?? {
      name: '',
      themeColor: '#000000',
      themeFontColor: '#ffffff',
      callToActionURL: '',
      callToActionText: [],
      logoID: undefined,
      squareLogoId: undefined,
      callToActionImageID: undefined,
      callToActionImageURL: '',
    };

    return profile;
  }

  async getRemotePeerProfile(
    hostURL: string,
    token: string
  ): Promise<RemotePeerProfile> {
    const key = `REMOTE-PEER-PROFILE:${hostURL}`;
    const cached = await this.cacheManager.get<RemotePeerProfile>(key);

    if (cached) {
      return cached;
    }

    const link = createSafeHostUrl(hostURL, 'v1');
    const client = new GraphQLClient(link, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const profile = await client.request<
      PeerProfileQuery,
      PeerProfileQueryVariables
    >(RemoteGqlPeerProfile);

    const updatedProfile = {
      ...profile.peerProfile,
      logo:
        profile.peerProfile.logo ?
          {
            ...profile.peerProfile.logo,
            createdAt: new Date(profile.peerProfile.logo.createdAt),
            modifiedAt: new Date(profile.peerProfile.logo.modifiedAt),
          }
        : profile.peerProfile.logo,
      squareLogo:
        profile.peerProfile.squareLogo ?
          {
            ...profile.peerProfile.squareLogo,
            createdAt: new Date(profile.peerProfile.squareLogo.createdAt),
            modifiedAt: new Date(profile.peerProfile.squareLogo.modifiedAt),
          }
        : profile.peerProfile.squareLogo,
      callToActionImage:
        profile.peerProfile.callToActionImage ?
          {
            ...profile.peerProfile.callToActionImage,
            createdAt: new Date(
              profile.peerProfile.callToActionImage.createdAt
            ),
            modifiedAt: new Date(
              profile.peerProfile.callToActionImage.modifiedAt
            ),
          }
        : profile.peerProfile.callToActionImage,
    };

    if (process.env['NODE_ENV'] === 'production' && updatedProfile) {
      await this.cacheManager.set(key, updatedProfile, 1000 * 3600 * 24);
    }

    return updatedProfile as RemotePeerProfile;
  }

  async upsertPeerProfile(peerProfile: UpsertPeerProfileInput) {
    const oldProfile = await this.prisma.peerProfile.findFirst({});

    if (oldProfile) {
      return this.prisma.peerProfile.update({
        where: {
          id: oldProfile.id,
        },
        data: {
          ...peerProfile,
          callToActionText: peerProfile.callToActionText as any,
        },
      });
    }

    return this.prisma.peerProfile.create({
      data: {
        ...peerProfile,
        callToActionText: peerProfile.callToActionText as any,
      },
    });
  }
}
