import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { PeerDataloaderService } from './peer-dataloader.service';

import { RemotePeerProfile } from './peer-profile.model';
import { PeerProfileService } from './peer-profile.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class RemotePeerProfileDataloaderService extends DataLoaderService<RemotePeerProfile> {
  constructor(
    protected peer: PeerDataloaderService,
    protected peerProfile: PeerProfileService
  ) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    const profiles = await Promise.all(
      ids.map(async peerId => {
        const peer = await this.peer.load(peerId);

        if (!peer) {
          throw new NotFoundException(`Peer with id ${peerId} not found`);
        }

        const profile = await this.peerProfile.getRemotePeerProfile(
          peer.hostURL,
          peer.token
        );

        return {
          id: peerId,
          ...profile,
        };
      })
    );

    return createOptionalsArray(
      ids,
      profiles,
      'id'
    ) as Array<RemotePeerProfile | null>;
  }
}
