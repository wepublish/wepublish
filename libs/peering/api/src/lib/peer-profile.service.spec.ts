import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { PeerProfileService } from './peer-profile.service';
import { PeerDataloaderService } from './peer-dataloader.service';
import { REMOTE_PEER_PROFILE_CACHE_NAMESPACE } from './peer-profile-cache';

// `vi.mock` is hoisted above ordinary top level consts, so the spy the factory
// closes over has to be hoisted with it.
const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('graphql-request', () => ({
  // Must be a `function`: vitest cannot `new` an arrow implementation.
  GraphQLClient: vi.fn().mockImplementation(function () {
    return { request };
  }),
}));

describe('PeerProfileService', () => {
  const originalEnv = process.env['NODE_ENV'];
  const localProfile = { id: 'profile-1', name: 'Local' };
  let service: PeerProfileService;
  let kv: KvTtlCacheService;
  let prisma: {
    peerProfile: {
      findFirst: Mock;
      update: Mock;
      create: Mock;
    };
  };

  beforeEach(async () => {
    request.mockReset();
    request.mockResolvedValue({
      peerProfile: {
        name: 'Remote',
        logo: null,
        squareLogo: null,
        callToActionImage: null,
      },
    });
    prisma = {
      peerProfile: {
        findFirst: vi.fn().mockResolvedValue(localProfile),
        update: vi.fn().mockResolvedValue(localProfile),
        create: vi.fn().mockResolvedValue(localProfile),
      },
    };

    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
      providers: [
        PeerProfileService,
        { provide: PrismaClient, useValue: prisma },
        { provide: PeerDataloaderService, useValue: {} },
      ],
    }).compile();

    service = module.get(PeerProfileService);
    kv = module.get(KvTtlCacheService);
  });

  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
  });

  it('serves the local peer profile from the cache', async () => {
    await service.getPeerProfile();
    const second = await service.getPeerProfile();

    expect(prisma.peerProfile.findFirst).toHaveBeenCalledTimes(1);
    expect(second).toEqual(localProfile);
  });

  it('loads the local peer profile again after it was saved', async () => {
    await service.getPeerProfile();
    await service.upsertPeerProfile({ name: 'Changed' } as never);
    await service.getPeerProfile();

    expect(prisma.peerProfile.findFirst).toHaveBeenCalledTimes(3);
  });

  it('caches remote peer profiles in production', async () => {
    process.env['NODE_ENV'] = 'production';

    await service.getRemotePeerProfile('https://peer.example', 'token');
    const second = await service.getRemotePeerProfile(
      'https://peer.example',
      'token'
    );

    expect(request).toHaveBeenCalledTimes(1);
    expect(second.name).toBe('Remote');
  });

  it('fetches remote peer profiles every time outside production', async () => {
    process.env['NODE_ENV'] = 'development';

    await service.getRemotePeerProfile('https://peer.example', 'token');
    await service.getRemotePeerProfile('https://peer.example', 'token');

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('fetches remote peer profiles again after the peers changed', async () => {
    process.env['NODE_ENV'] = 'production';

    await service.getRemotePeerProfile('https://peer.example', 'token');
    await kv.resetNamespace(REMOTE_PEER_PROFILE_CACHE_NAMESPACE);
    await service.getRemotePeerProfile('https://peer.example', 'token');

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('asks the remote peer again for another token, so a wrong token is not shown as working', async () => {
    process.env['NODE_ENV'] = 'production';

    await service.getRemotePeerProfile('https://peer.example', 'token');
    request.mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(
      service.getRemotePeerProfile('https://peer.example', 'wrong-token')
    ).rejects.toThrow('Unauthorized');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('keeps the token out of the cache key', async () => {
    process.env['NODE_ENV'] = 'production';
    const getOrLoadNs = vi.spyOn(kv, 'getOrLoadNs');

    await service.getRemotePeerProfile('https://peer.example', 'secret-token');

    const [[namespace, key]] = getOrLoadNs.mock.calls;
    expect(namespace).toBe(REMOTE_PEER_PROFILE_CACHE_NAMESPACE);
    expect(key).toContain('https://peer.example');
    expect(key).not.toContain('secret-token');
  });
});
