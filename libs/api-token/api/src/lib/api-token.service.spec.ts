import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  EXPIRED_API_TOKEN,
  unselectPassword,
} from '@wepublish/authentication/api';
import {
  CanCreateApiToken,
  CanDeleteOtherOrganizationEvents,
  CanGetOtherOrganizationEvents,
  CanGetOtherOrganizations,
  CanUpdateOrganization,
  CanUpdateOtherOrganizationEvents,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';

import { API_TOKEN_PREFIX, hashApiToken } from './api-token.crypto';
import { ApiTokenStatus } from './api-token.model';
import { ApiTokenService } from './api-token.service';

const prismaMock = () => {
  const store: any[] = [];
  const organizations = [{ id: 'org-a' }, { id: 'org-b' }];
  const users: Array<{ id: string; roleIDs: string[] }> = [];
  const memberships: Array<{ userId: string; organizationId: string }> = [];
  const roles = [
    { id: 'admin', permissionIDs: [] },
    { id: 'editor', permissionIDs: [] },
    {
      id: 'organisation-admin',
      permissionIDs: [CanUpdateOtherOrganizations.id],
    },
  ];

  return {
    store,
    users,
    memberships,
    organization: {
      findUnique: vi.fn(
        async ({ where }: any) =>
          organizations.find(organization => organization.id === where.id) ??
          null
      ),
    },
    organizationMember: {
      findUnique: vi.fn(
        async ({ where: { userId_organizationId } }: any) =>
          memberships.find(
            membership =>
              membership.userId === userId_organizationId.userId &&
              membership.organizationId === userId_organizationId.organizationId
          ) ?? null
      ),
    },
    user: {
      findUnique: vi.fn(
        async ({ where }: any) =>
          users.find(user => user.id === where.id) ?? null
      ),
    },
    userRole: {
      findMany: vi.fn(async ({ where }: any) =>
        roles.filter(role => where.id.in.includes(role.id))
      ),
    },
    apiToken: {
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `id-${store.length}`, ...data };
        store.push(row);
        return row;
      }),
      findUnique: vi.fn(
        async ({ where }: any) =>
          store.find(r => r.tokenHash === where.tokenHash) ?? null
      ),
      update: vi.fn(async ({ where, data }: any) => {
        const row = store.find(r => r.id === where.id);
        Object.assign(row, data);
        return row;
      }),
    },
  };
};

const service = (prisma: any) => new ApiTokenService(prisma as any);

const inDays = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

describe('createToken', () => {
  const creator = {
    userId: 'u1',
    permissions: ['CAN_GET_EVENTS'],
    organizationIds: [],
  };

  it('refuses a token that never expires', async () => {
    await expect(
      service(prismaMock()).createToken(
        { name: 'Forever', scopes: [], expiresAt: null as never },
        { userId: 'u1', permissions: [], organizationIds: [] }
      )
    ).rejects.toThrow(/expiry/i);
  });

  it('refuses an expiry more than three years out', async () => {
    await expect(
      service(prismaMock()).createToken(
        { name: 'Too long', scopes: [], expiresAt: inDays(366 * 3 + 2) },
        { userId: 'u1', permissions: [], organizationIds: [] }
      )
    ).rejects.toThrow(/three years/i);
  });

  it('refuses an expiry that has already passed', async () => {
    await expect(
      service(prismaMock()).createToken(
        { name: 'Stale', scopes: [], expiresAt: inDays(-1) },
        { userId: 'u1', permissions: [], organizationIds: [] }
      )
    ).rejects.toThrow(/future/i);
  });

  it('accepts an expiry just inside three years', async () => {
    const prisma = prismaMock();

    await expect(
      service(prisma).createToken(
        {
          name: 'Long lived',
          scopes: ['CAN_GET_EVENTS'],
          expiresAt: inDays(365 * 3),
        },
        creator
      )
    ).resolves.toBeTruthy();
  });

  it('returns the secret exactly once and stores only its hash', async () => {
    const prisma = prismaMock();

    const { token, apiToken } = await service(prisma).createToken(
      {
        name: 'Print Import',
        scopes: ['CAN_GET_EVENTS'],
        expiresAt: inDays(30),
      },
      {
        userId: 'u1',
        permissions: ['CAN_GET_EVENTS'],
        organizationIds: [],
      }
    );

    expect(token).toMatch(new RegExp(`^${API_TOKEN_PREFIX}`));
    expect(prisma.store[0].tokenHash).toBe(hashApiToken(token));
    expect(JSON.stringify(apiToken)).not.toContain(token);
  });

  it('stores a prefix so a key can be identified without its secret', async () => {
    const prisma = prismaMock();

    const { token } = await service(prisma).createToken(
      { name: 'k', scopes: [], expiresAt: inDays(30) },
      { userId: 'u1', permissions: [], organizationIds: [] }
    );

    expect(token.startsWith(prisma.store[0].prefix)).toBe(true);
  });

  it('refuses to grant a permission the creator does not hold', async () => {
    const prisma = prismaMock();

    await expect(
      service(prisma).createToken(
        { name: 'escalate', scopes: ['CAN_DELETE_ARTICLE'] },
        {
          userId: 'u1',
          permissions: ['CAN_GET_EVENTS'],
          organizationIds: [],
        }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('names the permission it refused, so the error is actionable', async () => {
    const prisma = prismaMock();

    await expect(
      service(prisma).createToken(
        { name: 'escalate', scopes: ['CAN_DELETE_ARTICLE'] },
        { userId: 'u1', permissions: [], organizationIds: [] }
      )
    ).rejects.toThrow(/CAN_DELETE_ARTICLE/);
  });
});

describe('binding a key to an organisation', () => {
  const create = (
    prisma: any,
    organizationId: string | null | undefined,
    creator: {
      permissions?: string[];
      organizationIds?: string[];
      scopes?: string[];
    } = {}
  ) =>
    service(prisma).createToken(
      {
        name: 'Dampfzentrale import',
        scopes: creator.scopes ?? [CanUpdateOrganization.id],
        expiresAt: inDays(30),
        organizationId,
      },
      {
        userId: 'u1',
        permissions: creator.permissions ?? [CanUpdateOrganization.id],
        organizationIds: creator.organizationIds ?? [],
      }
    );

  it('keeps a key without an organisation a platform key', async () => {
    const prisma = prismaMock();

    await create(prisma, undefined);

    expect(prisma.store[0].organizationId).toBeNull();
  });

  it('lets a member bind a key to their organisation', async () => {
    const prisma = prismaMock();

    const { apiToken } = await create(prisma, 'org-a', {
      organizationIds: ['org-a'],
    });

    expect(apiToken.organizationId).toBe('org-a');
    expect(prisma.store[0].organizationId).toBe('org-a');
  });

  it('refuses to bind a key to an organisation the creator does not belong to', async () => {
    const prisma = prismaMock();

    await expect(
      create(prisma, 'org-b', { organizationIds: ['org-a'] })
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.apiToken.create).not.toHaveBeenCalled();
  });

  it('does not let CAN_CREATE_API_TOKEN alone bind a key to a foreign organisation', async () => {
    const prisma = prismaMock();

    await expect(
      create(prisma, 'org-b', {
        permissions: [CanCreateApiToken.id, CanUpdateOrganization.id],
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets whoever may update any organisation bind a key to any of them', async () => {
    const prisma = prismaMock();

    const { apiToken } = await create(prisma, 'org-b', {
      permissions: [CanUpdateOtherOrganizations.id, CanUpdateOrganization.id],
    });

    expect(apiToken.organizationId).toBe('org-b');
  });

  it('does not count reading or editing other organisations‘ events as leave to bind', async () => {
    const prisma = prismaMock();

    await expect(
      create(prisma, 'org-b', {
        permissions: [
          CanGetOtherOrganizations.id,
          CanUpdateOtherOrganizationEvents.id,
          CanUpdateOrganization.id,
        ],
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses an organisation that does not exist', async () => {
    const prisma = prismaMock();

    await expect(
      create(prisma, 'org-gone', {
        permissions: [CanUpdateOtherOrganizations.id, CanUpdateOrganization.id],
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.apiToken.create).not.toHaveBeenCalled();
  });

  it.each([
    CanGetOtherOrganizationEvents,
    CanUpdateOtherOrganizationEvents,
    CanDeleteOtherOrganizationEvents,
    CanGetOtherOrganizations,
    CanUpdateOtherOrganizations,
  ])(
    'refuses to give a bound key $id, which would reach past its organisation',
    async permission => {
      const prisma = prismaMock();

      await expect(
        create(prisma, 'org-a', {
          organizationIds: ['org-a'],
          permissions: [permission.id],
          scopes: [permission.id],
        })
      ).rejects.toThrow(
        expect.objectContaining({
          constructor: BadRequestException,
          message: expect.stringContaining(permission.id),
        })
      );
      expect(prisma.apiToken.create).not.toHaveBeenCalled();
    }
  );

  it('still lets a platform key carry cross-organisation permissions', async () => {
    const prisma = prismaMock();

    await expect(
      create(prisma, null, {
        permissions: [CanUpdateOtherOrganizationEvents.id],
        scopes: [CanUpdateOtherOrganizationEvents.id],
      })
    ).resolves.toBeTruthy();
  });
});

describe('resolveToken', () => {
  const valid = {
    name: 'k',
    scopes: ['CAN_GET_EVENTS'],
    expiresAt: inDays(30),
    revokedAt: null,
  };

  it('resolves a live token to its own scopes, not its creator‘s', async () => {
    const prisma = prismaMock();
    const { token } = await service(prisma).createToken(
      { name: 'k', scopes: ['CAN_GET_EVENTS'], expiresAt: inDays(30) },
      {
        userId: 'u1',
        permissions: ['CAN_GET_EVENTS', 'CAN_DELETE_ARTICLE'],
        organizationIds: [],
      }
    );

    const resolved = await service(prisma).resolveToken(token);

    expect(resolved?.scopes).toEqual(['CAN_GET_EVENTS']);
  });

  it('loads the creator with the token, without the password', async () => {
    const prisma = prismaMock();
    prisma.store.push({
      ...valid,
      id: 'a',
      tokenHash: hashApiToken('wep_x'),
      createdById: 'u1',
    });

    await service(prisma).resolveToken('wep_x');

    expect(prisma.apiToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashApiToken('wep_x') },
      include: { createdBy: { select: unselectPassword } },
    });
  });

  it('rejects an unknown token', async () => {
    const prisma = prismaMock();

    expect(await service(prisma).resolveToken('wep_nope')).toBeNull();
  });

  it('rejects a revoked token', async () => {
    const prisma = prismaMock();
    prisma.store.push({
      ...valid,
      id: 'a',
      tokenHash: hashApiToken('wep_x'),
      revokedAt: new Date(),
    });

    expect(await service(prisma).resolveToken('wep_x')).toBeNull();
  });

  it('rejects an expired token loudly, so the integrator knows to rotate it', async () => {
    const prisma = prismaMock();
    prisma.store.push({
      ...valid,
      id: 'a',
      tokenHash: hashApiToken('wep_x'),
      expiresAt: new Date(Date.now() - 1000),
    });

    const resolving = service(prisma).resolveToken('wep_x');

    await expect(resolving).rejects.toThrow(UnauthorizedException);
    await expect(resolving).rejects.toMatchObject({ cause: EXPIRED_API_TOKEN });
  });

  it('accepts a token that has not expired yet', async () => {
    const prisma = prismaMock();
    prisma.store.push({
      ...valid,
      id: 'a',
      tokenHash: hashApiToken('wep_x'),
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(await service(prisma).resolveToken('wep_x')).not.toBeNull();
  });

  it('records last use, but not on every request', async () => {
    const prisma = prismaMock();
    prisma.store.push({
      ...valid,
      id: 'a',
      tokenHash: hashApiToken('wep_x'),
      lastUsedAt: new Date(),
    });

    await service(prisma).resolveToken('wep_x');

    expect(prisma.apiToken.update).not.toHaveBeenCalled();
  });

  it('records last use when the stored stamp is stale', async () => {
    const prisma = prismaMock();
    prisma.store.push({
      ...valid,
      id: 'a',
      tokenHash: hashApiToken('wep_x'),
      lastUsedAt: new Date(Date.now() - 3600_000),
    });

    await service(prisma).resolveToken('wep_x');

    expect(prisma.apiToken.update).toHaveBeenCalled();
  });

  describe('a key bound to an organisation', () => {
    const bound = (
      prisma: ReturnType<typeof prismaMock>,
      createdById: string | null
    ) =>
      prisma.store.push({
        ...valid,
        id: 'a',
        tokenHash: hashApiToken('wep_x'),
        organizationId: 'org-a',
        createdById,
      });

    it('works while its creator is still a member of the organisation', async () => {
      const prisma = prismaMock();
      prisma.users.push({ id: 'u1', roleIDs: [] });
      prisma.memberships.push({ userId: 'u1', organizationId: 'org-a' });
      bound(prisma, 'u1');

      expect(await service(prisma).resolveToken('wep_x')).not.toBeNull();
    });

    it('stops working once its creator has left the organisation', async () => {
      const prisma = prismaMock();
      prisma.users.push({ id: 'u1', roleIDs: ['editor'] });
      prisma.memberships.push({ userId: 'u1', organizationId: 'org-b' });
      bound(prisma, 'u1');

      expect(await service(prisma).resolveToken('wep_x')).toBeNull();
      expect(prisma.apiToken.update).not.toHaveBeenCalled();
    });

    it('stops working once its creator has been deleted', async () => {
      const prisma = prismaMock();
      bound(prisma, null);

      expect(await service(prisma).resolveToken('wep_x')).toBeNull();
    });

    it.each(['organisation-admin', 'admin'])(
      'keeps working for a creator outside the organisation whose role %s may update any organisation',
      async role => {
        const prisma = prismaMock();
        prisma.users.push({ id: 'u1', roleIDs: [role] });
        bound(prisma, 'u1');

        expect(await service(prisma).resolveToken('wep_x')).not.toBeNull();
      }
    );

    it('stops working once a creator outside the organisation loses leave to update any organisation', async () => {
      const prisma = prismaMock();
      prisma.users.push({ id: 'u1', roleIDs: ['editor'] });
      bound(prisma, 'u1');

      expect(await service(prisma).resolveToken('wep_x')).toBeNull();
    });

    it('does not look up memberships for a platform key', async () => {
      const prisma = prismaMock();
      prisma.store.push({
        ...valid,
        id: 'a',
        tokenHash: hashApiToken('wep_x'),
        organizationId: null,
        createdById: null,
      });

      expect(await service(prisma).resolveToken('wep_x')).not.toBeNull();
      expect(prisma.organizationMember.findUnique).not.toHaveBeenCalled();
    });
  });
});

describe('ownership scoping', () => {
  const rows = (store: any[]) => {
    store.push(
      { id: 'mine', name: 'mine', createdById: 'u1', scopes: [] },
      { id: 'theirs', name: 'theirs', createdById: 'u2', scopes: [] }
    );
  };

  const listPrisma = () => {
    const store: any[] = [];
    return {
      store,
      apiToken: {
        count: vi.fn(
          async ({ where }: any) =>
            store.filter(
              r => !where?.createdById || r.createdById === where.createdById
            ).length
        ),
        findMany: vi.fn(async ({ where }: any) =>
          store.filter(
            r => !where?.createdById || r.createdById === where.createdById
          )
        ),
        update: vi.fn(),
        findUnique: vi.fn(
          async ({ where }: any) => store.find(r => r.id === where.id) ?? null
        ),
      },
    };
  };

  it('shows only your own tokens by default', async () => {
    const prisma = listPrisma();
    rows(prisma.store);

    const result = await service(prisma).getApiTokens(
      {},
      {
        userId: 'u1',
        canSeeAll: false,
      }
    );

    expect(result.nodes.map((n: any) => n.id)).toEqual(['mine']);
  });

  it('shows everyone‘s tokens when the caller may see all', async () => {
    const prisma = listPrisma();
    rows(prisma.store);

    const result = await service(prisma).getApiTokens(
      {},
      {
        userId: 'u1',
        canSeeAll: true,
      }
    );

    expect(result.nodes.map((n: any) => n.id)).toEqual(['mine', 'theirs']);
  });

  it('narrows to one creator when the caller may see all', async () => {
    const prisma = listPrisma();
    rows(prisma.store);

    const result = await service(prisma).getApiTokens(
      { createdById: 'u2' },
      { userId: 'u1', canSeeAll: true }
    );

    expect(result.nodes.map((n: any) => n.id)).toEqual(['theirs']);
  });

  it('ignores the creator filter for a caller who only sees their own', async () => {
    const prisma = listPrisma();
    rows(prisma.store);

    const result = await service(prisma).getApiTokens(
      { createdById: 'u2' },
      { userId: 'u1', canSeeAll: false }
    );

    expect(result.nodes.map((n: any) => n.id)).toEqual(['mine']);
  });

  const whereFor = async (status: ApiTokenStatus) => {
    const prisma = listPrisma();

    await service(prisma).getApiTokens(
      { status },
      { userId: 'u1', canSeeAll: true }
    );

    return prisma.apiToken.findMany.mock.calls[0][0].where;
  };

  it('narrows to the keys that still work', async () => {
    expect(await whereFor(ApiTokenStatus.Active)).toMatchObject({
      revokedAt: null,
      expiresAt: { gt: expect.any(Date) },
    });
  });

  it('narrows to the keys that ran out', async () => {
    expect(await whereFor(ApiTokenStatus.Expired)).toMatchObject({
      revokedAt: null,
      expiresAt: { lte: expect.any(Date) },
    });
  });

  it('narrows to the keys that were taken away', async () => {
    expect(await whereFor(ApiTokenStatus.Revoked)).toMatchObject({
      revokedAt: { not: null },
    });
  });

  it('refuses to revoke someone else‘s token', async () => {
    const prisma = listPrisma();
    rows(prisma.store);

    await expect(
      service(prisma).revokeToken('theirs', {
        userId: 'u1',
        canRevokeAll: false,
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows revoking your own token', async () => {
    const prisma = listPrisma();
    rows(prisma.store);

    await service(prisma).revokeToken('mine', {
      userId: 'u1',
      canRevokeAll: false,
    });

    expect(prisma.apiToken.update).toHaveBeenCalled();
  });

  it('allows revoking anyone‘s token with the broader permission', async () => {
    const prisma = listPrisma();
    rows(prisma.store);

    await service(prisma).revokeToken('theirs', {
      userId: 'u1',
      canRevokeAll: true,
    });

    expect(prisma.apiToken.update).toHaveBeenCalled();
  });
});
