import { PrismaClient } from '@prisma/client';
import {
  ImpersonationSearchService,
  USER_SEARCH_LIMIT,
  clampSearchLimit,
} from './impersonation.service';

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
    user: { findMany: jest.Mock };
    userRole: { findMany: jest.Mock };
  };
  let service: ImpersonationSearchService;

  beforeEach(() => {
    prisma = {
      user: { findMany: jest.fn().mockResolvedValue([]) },
      userRole: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new ImpersonationSearchService(prisma as unknown as PrismaClient);
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
