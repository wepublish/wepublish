import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';

import { TokenService } from './token.service';

const setup = (existingRoleIds: string[] = ['role-1', 'role-2']) => {
  const sessionCache = { invalidate: vi.fn().mockResolvedValue(undefined) };
  const prisma = {
    token: {
      create: vi.fn(async ({ data }) => ({ id: 'token-1', ...data })),
      update: vi.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    },
    userRole: {
      findMany: vi.fn(async ({ where }) =>
        (where.id.in as string[])
          .filter(id => existingRoleIds.includes(id))
          .map(id => ({ id }))
      ),
    },
  };
  const service = new TokenService(
    prisma as unknown as PrismaClient,
    sessionCache as unknown as SessionCacheInvalidator
  );

  return { service, prisma, sessionCache };
};

describe('TokenService', () => {
  describe('createToken', () => {
    it('stores no roles when none are given, as before', async () => {
      const { service, prisma } = setup();

      await service.createToken({ name: 'peer' });

      expect(prisma.token.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'peer', roleIDs: [] }),
      });
    });

    it('stores the given roles with the new token', async () => {
      const { service, prisma } = setup();

      const token = await service.createToken({
        name: 'export',
        roleIDs: ['role-1', 'role-2'],
      });

      expect(prisma.token.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'export',
          roleIDs: ['role-1', 'role-2'],
          token: expect.any(String),
        }),
      });
      expect(token.roleIDs).toEqual(['role-1', 'role-2']);
    });

    it('refuses a role that does not exist and creates nothing', async () => {
      const { service, prisma } = setup(['role-1']);

      await expect(
        service.createToken({ name: 'export', roleIDs: ['role-1', 'nope'] })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.token.create).not.toHaveBeenCalled();
    });
  });

  describe('updateToken', () => {
    it('replaces the roles and clears cached sessions so they apply at once', async () => {
      const { service, prisma, sessionCache } = setup();

      await service.updateToken({ id: 'token-1', roleIDs: ['role-2'] });

      expect(prisma.token.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { roleIDs: ['role-2'] },
      });
      expect(sessionCache.invalidate).toHaveBeenCalled();
    });

    it('can take every role away', async () => {
      const { service, prisma } = setup();

      await service.updateToken({ id: 'token-1', roleIDs: [] });

      expect(prisma.token.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { roleIDs: [] },
      });
    });

    it('renames without touching the roles', async () => {
      const { service, prisma } = setup();

      await service.updateToken({ id: 'token-1', name: 'renamed' });

      expect(prisma.token.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { name: 'renamed' },
      });
    });

    it('refuses a role that does not exist and changes nothing', async () => {
      const { service, prisma, sessionCache } = setup(['role-1']);

      await expect(
        service.updateToken({ id: 'token-1', roleIDs: ['nope'] })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.token.update).not.toHaveBeenCalled();
      expect(sessionCache.invalidate).not.toHaveBeenCalled();
    });
  });
});
