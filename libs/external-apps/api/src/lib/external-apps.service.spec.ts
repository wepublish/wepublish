import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CanGetAllApiTokens, CanGetApiTokens } from '@wepublish/permissions';

import { ExternalAppsService } from './external-apps.service';

const NOW = new Date('2026-10-23T10:00:00.000Z');

const apiToken = (overrides: Record<string, unknown> = {}) => ({
  id: 'key-1',
  name: 'nw-one-click-export',
  prefix: 'wep_abcd1234',
  scopes: ['CAN_GET_SUBSCRIPTIONS'],
  expiresAt: new Date('2027-10-23T00:00:00.000Z'),
  revokedAt: null,
  lastUsedAt: null,
  createdById: 'admin-1',
  ...overrides,
});

const admin = { userId: 'admin-1', permissions: [CanGetAllApiTokens.id] };
const owner = { userId: 'admin-1', permissions: [CanGetApiTokens.id] };
const otherEditor = { userId: 'editor-2', permissions: [CanGetApiTokens.id] };
const noKeys = { userId: 'admin-1', permissions: [] };

type Data = { data: Record<string, unknown> };

const createPrisma = () => ({
  apiToken: {
    findUnique: vi.fn(async (): Promise<ReturnType<typeof apiToken> | null> =>
      apiToken()
    ),
  },
  externalApps: {
    create: vi.fn(async ({ data }: Data) => ({ id: 'app-1', ...data })),
    update: vi.fn(async ({ data }: Data) => ({ id: 'app-1', ...data })),
    findUnique: vi.fn(async () => ({ id: 'app-1', apiTokenId: null })),
  },
});

describe('ExternalAppsService', () => {
  let prisma: ReturnType<typeof createPrisma>;
  let service: ExternalAppsService;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    prisma = createPrisma();
    service = new ExternalAppsService(prisma as unknown as PrismaClient);
    // injected by @PrimeDataLoader
    Object.assign(service, {
      __DATALOADER__ExternalAppsDataloaderService: { prime: vi.fn() },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const create = (apiTokenId: string | null | undefined, reader = admin) =>
    service.createExternalApp(
      {
        name: 'Druckliste Export',
        url: 'https://export.neuewege.ch/',
        target: 'IFRAME' as never,
        apiTokenId,
      },
      reader
    );

  describe('linking an api key', () => {
    it('links a key the editor may see', async () => {
      await create('key-1');

      expect(prisma.externalApps.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ apiTokenId: 'key-1' }),
      });
    });

    it('lets an editor link a key they created themselves', async () => {
      await create('key-1', owner);

      expect(prisma.externalApps.create).toHaveBeenCalled();
    });

    it("refuses a key someone else created without seeing everyone's keys", async () => {
      await expect(create('key-1', otherEditor)).rejects.toThrow(
        BadRequestException
      );
      expect(prisma.externalApps.create).not.toHaveBeenCalled();
    });

    it('refuses a key without the permission to see api keys', async () => {
      await expect(create('key-1', noKeys)).rejects.toThrow(
        BadRequestException
      );
    });

    it('refuses an unknown key', async () => {
      prisma.apiToken.findUnique.mockResolvedValue(null);

      await expect(create('key-x')).rejects.toThrow(BadRequestException);
    });

    it('refuses a revoked key', async () => {
      prisma.apiToken.findUnique.mockResolvedValue(
        apiToken({ revokedAt: new Date('2026-10-01T00:00:00.000Z') })
      );

      await expect(create('key-1')).rejects.toThrow(/revoked/);
    });

    it('refuses an expired key', async () => {
      prisma.apiToken.findUnique.mockResolvedValue(
        apiToken({ expiresAt: new Date('2026-10-01T00:00:00.000Z') })
      );

      await expect(create('key-1')).rejects.toThrow(/expired/);
    });

    it('creates an app without a key', async () => {
      await create(undefined, noKeys);

      expect(prisma.apiToken.findUnique).not.toHaveBeenCalled();
      expect(prisma.externalApps.create).toHaveBeenCalled();
    });

    it('unlinks the key when updating with null', async () => {
      await service.updateExternalApp(
        { id: 'app-1', apiTokenId: null },
        noKeys
      );

      expect(prisma.apiToken.findUnique).not.toHaveBeenCalled();
      expect(prisma.externalApps.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: { apiTokenId: null },
      });
    });

    it('checks the key when updating', async () => {
      await expect(
        service.updateExternalApp(
          { id: 'app-1', apiTokenId: 'key-1' },
          otherEditor
        )
      ).rejects.toThrow(BadRequestException);
      expect(prisma.externalApps.update).not.toHaveBeenCalled();
    });

    it('keeps the key when an update does not mention it', async () => {
      await service.updateExternalApp({ id: 'app-1', name: 'Neu' }, noKeys);

      expect(prisma.externalApps.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: { name: 'Neu' },
      });
    });
  });

  describe('linkedApiToken', () => {
    it('returns the linked key to an editor who may see it', async () => {
      await expect(
        service.linkedApiToken({ apiTokenId: 'key-1' }, admin)
      ).resolves.toEqual(apiToken());
    });

    it('hides the linked key from editors who may not see it', async () => {
      await expect(
        service.linkedApiToken({ apiTokenId: 'key-1' }, otherEditor)
      ).resolves.toBeNull();
    });

    it('is null without a linked key', async () => {
      await expect(
        service.linkedApiToken({ apiTokenId: null }, admin)
      ).resolves.toBeNull();
      expect(prisma.apiToken.findUnique).not.toHaveBeenCalled();
    });
  });
});
