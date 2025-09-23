import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { PeerDataloaderService } from './peer-dataloader.service';
import { createSafeHostUrl } from './create-safe-host-url';
import { GraphQLClient } from 'graphql-request';
import {
  PeerProfile,
  PeerProfileQuery,
  PeerProfileQueryVariables,
} from './remote/graphql';
import { RemotePeerProfile } from './peer-profile.model';

@Injectable({
  scope: Scope.REQUEST,
})
export class RemotePeerProfileDataloaderService extends DataLoaderService<RemotePeerProfile> {
  constructor(protected peer: PeerDataloaderService) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    const profiles = await Promise.all(
      ids.map(async peerId => {
        const peer = await this.peer.load(peerId);

        if (!peer) {
          throw new NotFoundException(`Peer with id ${peerId} not found`);
        }

        const link = createSafeHostUrl(peer.hostURL, 'v1');
        const client = new GraphQLClient(link, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${peer.token}`,
          },
        });

        const profile = await client.request<
          PeerProfileQuery,
          PeerProfileQueryVariables
        >(PeerProfile);

        return {
          id: peerId,
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
      })
    );

    return createOptionalsArray(
      ids,
      profiles,
      'id'
    ) as unknown as Array<RemotePeerProfile | null>;
  }
}
