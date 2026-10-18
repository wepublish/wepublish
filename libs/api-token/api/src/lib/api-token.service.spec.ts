import { ForbiddenException } from '@nestjs/common';

import { API_TOKEN_PREFIX, hashApiToken } from './api-token.crypto';
import { ApiTokenService } from './api-token.service';

const prismaMock = () => {
  const store: any[] = [];

  return {
    store,
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

describe('createToken', () => {
  it('returns the secret exactly once and stores only its hash', async () => {
    const prisma = prismaMock();

    const { token, apiToken } = await service(prisma).createToken(
      { name: 'Print Import', scopes: ['CAN_GET_EVENTS'] },
      { userId: 'u1', permissions: ['CAN_GET_EVENTS'] }
    );

    expect(token).toMatch(new RegExp(`^${API_TOKEN_PREFIX}`));
    expect(prisma.store[0].tokenHash).toBe(hashApiToken(token));
    expect(JSON.stringify(apiToken)).not.toContain(token);
  });

  it('stores a prefix so a key can be identified without its secret', async () => {
    const prisma = prismaMock();

    const { token } = await service(prisma).createToken(
      { name: 'k', scopes: [] },
      { userId: 'u1', permissions: [] }
    );

    expect(token.startsWith(prisma.store[0].prefix)).toBe(true);
  });

  it('refuses to grant a permission the creator does not hold', async () => {
    const prisma = prismaMock();

    await expect(
      service(prisma).createToken(
        { name: 'escalate', scopes: ['CAN_DELETE_ARTICLE'] },
        { userId: 'u1', permissions: ['CAN_GET_EVENTS'] }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('names the permission it refused, so the error is actionable', async () => {
    const prisma = prismaMock();

    await expect(
      service(prisma).createToken(
        { name: 'escalate', scopes: ['CAN_DELETE_ARTICLE'] },
        { userId: 'u1', permissions: [] }
      )
    ).rejects.toThrow(/CAN_DELETE_ARTICLE/);
  });
});

describe('resolveToken', () => {
  const valid = {
    name: 'k',
    scopes: ['CAN_GET_EVENTS'],
    expiresAt: null,
    revokedAt: null,
  };

  it('resolves a live token to its own scopes, not its creator‘s', async () => {
    const prisma = prismaMock();
    const { token } = await service(prisma).createToken(
      { name: 'k', scopes: ['CAN_GET_EVENTS'] },
      { userId: 'u1', permissions: ['CAN_GET_EVENTS', 'CAN_DELETE_ARTICLE'] }
    );

    const resolved = await service(prisma).resolveToken(token);

    expect(resolved?.scopes).toEqual(['CAN_GET_EVENTS']);
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

  it('rejects an expired token', async () => {
    const prisma = prismaMock();
    prisma.store.push({
      ...valid,
      id: 'a',
      tokenHash: hashApiToken('wep_x'),
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(await service(prisma).resolveToken('wep_x')).toBeNull();
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
