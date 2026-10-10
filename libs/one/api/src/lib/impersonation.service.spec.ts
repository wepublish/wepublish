import { PrismaClient } from '@prisma/client';
import {
  ImpersonationSearchService,
  USER_SEARCH_LIMIT,
  clampSearchLimit,
} from './impersonation.service';
import type { Mock } from 'vitest';

describe('clampSearchLimit', () => {
  it('defaults when no limit is given', () => {
    expect(clampSearchLimit(undefined)).toBe(10);
    expect(clampSearchLimit(0)).toBe(10);
  });

  it('never exceeds the hard cap, so One cannot pull the user base', () => {
    expect(clampSearchLimit(10_000)).toBe(USER_SEARCH_LIMIT);
    expect(USER_SEARCH_LIMIT).toBe(25);
  });

  it('passes a sensible limit through', () => {
    expect(clampSearchLimit(5)).toBe(5);
  });
});

describe('ImpersonationSearchService', () => {
  let prisma: {
    user: { findMany: Mock; findFirst: Mock };
    userRole: { findMany: Mock };
  };
  let service: ImpersonationSearchService;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      userRole: { findMany: vi.fn().mockResolvedValue([]) },
    };
    service = new ImpersonationSearchService(prisma as unknown as PrismaClient);
  });

  it('puts the account with exactly that address first, so look-alikes cannot push it out', async () => {
    const lookAlikes = Array.from({ length: 10 }, (_, index) => ({
      id: `fake-${index}`,
      email: `a${index}@x.ch`,
      name: 'admin@wepublish.ch',
      active: true,
      roleIDs: [],
    }));
    prisma.user.findMany.mockResolvedValue(lookAlikes);
    prisma.user.findFirst.mockResolvedValue({
      id: 'support',
      email: 'admin@wepublish.ch',
      name: 'Support',
      active: true,
      roleIDs: [],
    });

    const users = await service.searchUsers('admin@wepublish.ch');

    expect(users[0]).toMatchObject({ id: 'support' });
    expect(users).toHaveLength(10);
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: 'admin@wepublish.ch', mode: 'insensitive' } },
      })
    );
  });

  it('refuses to search on a one-character term', async () => {
    await expect(service.searchUsers('a')).resolves.toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('refuses an empty term rather than returning everyone', async () => {
    await expect(service.searchUsers('   ')).resolves.toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('resolves role ids to names', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'u1',
        email: 'a@b.ch',
        name: 'A',
        active: true,
        roleIDs: ['admin'],
      },
    ]);
    prisma.userRole.findMany.mockResolvedValue([
      { id: 'admin', name: 'Admin' },
    ]);

    await expect(service.searchUsers('a@b')).resolves.toEqual([
      { id: 'u1', email: 'a@b.ch', name: 'A', active: true, roles: ['Admin'] },
    ]);
  });

  it('keeps an unknown role id rather than dropping it silently', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'u1',
        email: 'a@b.ch',
        name: null,
        active: false,
        roleIDs: ['ghost'],
      },
    ]);

    const [user] = await service.searchUsers('a@b');

    expect(user?.roles).toEqual(['ghost']);
    expect(user?.active).toBe(false);
  });
});
