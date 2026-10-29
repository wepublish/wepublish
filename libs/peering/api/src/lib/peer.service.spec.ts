import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { PeerService } from './peer.service';
import { PeerDataloaderService } from './peer-dataloader.service';
import { REMOTE_PEER_PROFILE_CACHE_NAMESPACE } from './peer-profile-cache';

describe('PeerService', () => {
  let service: PeerService;
  let resets: { reset: Mock };

  beforeEach(async () => {
    resets = {
      reset: vi.fn().mockResolvedValue(undefined),
    } satisfies Pick<NamespaceResets, 'reset'>;
    const peer = { id: 'peer-1', hostURL: 'https://peer.example' };

    const module = await Test.createTestingModule({
      providers: [
        PeerService,
        {
          provide: PrismaClient,
          useValue: {
            peer: {
              create: vi.fn().mockResolvedValue(peer),
              update: vi.fn().mockResolvedValue(peer),
              delete: vi.fn().mockResolvedValue(peer),
            },
          },
        },
        { provide: PeerDataloaderService, useValue: { prime: vi.fn() } },
        { provide: NamespaceResets, useValue: resets },
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

    expect(resets.reset).toHaveBeenCalledWith(
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE
    );
  });

  it('forgets cached remote profiles after a peer was changed', async () => {
    await service.updatePeer({ id: 'peer-1', name: 'Peer' } as never);

    expect(resets.reset).toHaveBeenCalledWith(
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE
    );
  });

  it('forgets cached remote profiles after a peer was deleted', async () => {
    await service.deletePeer('peer-1');

    expect(resets.reset).toHaveBeenCalledWith(
      REMOTE_PEER_PROFILE_CACHE_NAMESPACE
    );
  });
});
