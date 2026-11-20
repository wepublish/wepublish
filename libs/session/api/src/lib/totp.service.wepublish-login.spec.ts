import type { Mock } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import {
  DistributedClaims,
  DistributedCounters,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { ManagedByWepublishLoginError } from '@wepublish/user/api';
import { TotpService } from './totp.service';

describe('TotpService.resetTotp', () => {
  let prisma: { user: { findUnique: Mock; update: Mock } };
  let service: TotpService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    };
    const dragonfly = new FakeDragonfly();

    service = new TotpService(
      prisma as unknown as PrismaClient,
      { invalidate: vi.fn() } as unknown as SessionCacheInvalidator,
      new DistributedClaims(dragonfly),
      new DistributedCounters(dragonfly)
    );
  });

  it('refuses to reset an account managed by the We.Publish login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      wepublishLoginSubject: 'zitadel-1',
    });

    await expect(service.resetTotp('user-1')).rejects.toBeInstanceOf(
      ManagedByWepublishLoginError
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('still resets every other account', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      wepublishLoginSubject: null,
    });

    await service.resetTotp('user-2');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-2' } })
    );
  });
});
