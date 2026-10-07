import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  UpsertPeerProfileInput,
  RemotePeerProfile,
} from './peer-profile.model';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { createSafeHostUrl } from './create-safe-host-url';
import { GraphQLClient } from 'graphql-request';
import { createHash } from 'crypto';
import {
  PeerProfileDocument as RemoteGqlPeerProfileDocument,
  PeerProfileQuery,
  PeerProfileQueryVariables,
} from './remote';
import { PeerDataloaderService } from './peer-dataloader.service';
import { PEER_USER_AGENT } from '@wepublish/authentication/api';
import {
  LOCAL_PEER_PROFILE_CACHE_NAMESPACE,
  LOCAL_PEER_PROFILE_CACHE_TTL_SECONDS,
  REMOTE_PEER_PROFILE_CACHE_NAMESPACE,
  REMOTE_PEER_PROFILE_CACHE_TTL_SECONDS,
} from './peer-profile-cache';

@Injectable()
export class PeerProfileService {
  constructor(
    private prisma: PrismaClient,
    protected peer: PeerDataloaderService,
    private kv: KvTtlCacheService
  ) {}

  async getPeerProfile() {
    // @TODO: move fallback to seed
    const profile = (await this.kv.getOrLoadNs(
      LOCAL_PEER_PROFILE_CACHE_NAMESPACE,
      'local',
      () => this.prisma.peerProfile.findFirst({}),
      LOCAL_PEER_PROFILE_CACHE_TTL_SECONDS
    )) ?? {
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
    if (process.env['NODE_ENV'] !== 'production') {
      return this.fetchRemotePeerProfile(hostURL, token);
    }

    return this.kv.getOrLoadNs(
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE,
      `${hostURL}:${createHash('sha256').update(token).digest('hex')}`,
      () => this.fetchRemotePeerProfile(hostURL, token),
      REMOTE_PEER_PROFILE_CACHE_TTL_SECONDS
    );
  }

  private async fetchRemotePeerProfile(
    hostURL: string,
    token: string
  ): Promise<RemotePeerProfile> {
    const link = createSafeHostUrl(hostURL, 'v1');
    const client = new GraphQLClient(link, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': PEER_USER_AGENT,
      },
    });

    const profile = await client.request<
      PeerProfileQuery,
      PeerProfileQueryVariables
    >(RemoteGqlPeerProfileDocument);

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

    return updatedProfile as RemotePeerProfile;
  }

  async upsertPeerProfile(peerProfile: UpsertPeerProfileInput) {
    const oldProfile = await this.prisma.peerProfile.findFirst({});

    const saved =
      oldProfile ?
        await this.prisma.peerProfile.update({
          where: {
            id: oldProfile.id,
          },
          data: {
            ...peerProfile,
            callToActionText: peerProfile.callToActionText as any,
          },
        })
      : await this.prisma.peerProfile.create({
          data: {
            ...peerProfile,
            callToActionText: peerProfile.callToActionText as any,
          },
        });
    await this.kv.resetNamespace(LOCAL_PEER_PROFILE_CACHE_NAMESPACE);

    return saved;
  }
}
