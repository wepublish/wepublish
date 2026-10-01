import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PeerService } from './peer.service';
import { PeerDataloaderService } from './peer-dataloader.service';
import { REMOTE_PEER_PROFILE_CACHE_NAMESPACE } from './peer-profile-cache';

describe('PeerService', () => {
  let service: PeerService;
  let kv: { resetNamespace: jest.Mock };

  beforeEach(async () => {
    kv = { resetNamespace: jest.fn().mockResolvedValue(undefined) };
    const peer = { id: 'peer-1', hostURL: 'https://peer.example' };

    const module = await Test.createTestingModule({
      providers: [
        PeerService,
        {
          provide: PrismaClient,
          useValue: {
            peer: {
              create: jest.fn().mockResolvedValue(peer),
              update: jest.fn().mockResolvedValue(peer),
              delete: jest.fn().mockResolvedValue(peer),
            },
          },
        },
        { provide: PeerDataloaderService, useValue: { prime: jest.fn() } },
        { provide: KvTtlCacheService, useValue: kv },
      ],
    }).compile();

    service = module.get(PeerService);
  });

  it('forgets cached peers after a peer was created, a lookup may have cached it as missing', async () => {
    await service.createPeer({
      name: 'Peer',
      slug: 'peer',
      hostURL: 'https://peer.example',
      token: 'peer-token',
    } as never);

    expect(kv.resetNamespace).toHaveBeenCalledWith(
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE
    );
  });

  it('forgets cached remote profiles after a peer was changed', async () => {
    await service.updatePeer({ id: 'peer-1', name: 'Peer' } as never);

    expect(kv.resetNamespace).toHaveBeenCalledWith(
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE
    );
  });

  it('forgets cached remote profiles after a peer was deleted', async () => {
    await service.deletePeer('peer-1');

    expect(kv.resetNamespace).toHaveBeenCalledWith(
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE
    );
  });
});
