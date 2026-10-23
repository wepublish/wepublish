import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  AuthSession,
  AuthSessionType,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import {
  CanGetOtherOrganizations,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import { SortOrder } from '@wepublish/utils/api';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import { OrganizationSort } from './organization.model';
import {
  createOrganizationFilter,
  createOrganizationOrder,
  OrganizationService,
} from './organization.service';

const user = (
  organizationIds: string[],
  ...permissionIDs: string[]
): AuthSession =>
  ({
    type: AuthSessionType.User,
    id: 'session-1',
    token: 'token',
    user: { id: 'user-1' },
    roles: [{ id: 'role', permissionIDs }],
    organizationIds,
    createdAt: new Date(),
    expiresAt: new Date(),
  }) as AuthSession;

const apiKey = (...permissions: string[]): AuthSession => ({
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Partner app',
  token: 'token',
  permissions,
  organizationId: null,
  user: null,
});

const organizationKey = (
  organizationId: string,
  ...permissions: string[]
): AuthSession => ({
  type: AuthSessionType.ApiToken,
  id: 'key-2',
  name: 'Venue app',
  token: 'token',
  permissions,
  organizationId,
  user: null,
});

const crossOrg = user([], CanUpdateOtherOrganizations.id);
const crossOrgReader = user([], CanGetOtherOrganizations.id);

const organization = (overrides: Record<string, unknown> = {}) => ({
  id: 'org-1',
  name: 'Dampfzentrale',
  slug: 'dampfzentrale',
  enabled: true,
  partner: false,
  createdByMigration: false,
  zip: null,
  latitude: null,
  longitude: null,
  regionId: null,
  ...overrides,
});

describe('createOrganizationFilter', () => {
  it('always applies what the caller may see', () => {
    expect(createOrganizationFilter({}, undefined).AND).toContainEqual({
      enabled: true,
    });
    expect(
      createOrganizationFilter(undefined, crossOrg).AND
    ).not.toContainEqual({ enabled: true });
  });

  it('matches names case-insensitively', () => {
    expect(
      createOrganizationFilter({ name: 'dampf' }, undefined).AND
    ).toContainEqual({ name: { contains: 'dampf', mode: 'insensitive' } });
  });

  it('maps ids, partner, enabled, region and createdByMigration', () => {
    const where = createOrganizationFilter(
      {
        ids: ['a', 'b'],
        partner: true,
        enabled: false,
        regionId: 'region-1',
        createdByMigration: true,
      },
      crossOrg
    );

    expect(where.AND).toEqual(
      expect.arrayContaining([
        { id: { in: ['a', 'b'] } },
        { partner: true },
        { enabled: false },
        { regionId: 'region-1' },
        { createdByMigration: true },
      ])
    );
  });

  it('limits mine to the organisations of the caller', () => {
    expect(
      createOrganizationFilter({ mine: true }, user(['a'])).AND
    ).toContainEqual({ id: { in: ['a'] } });
    expect(
      createOrganizationFilter({ mine: true }, undefined).AND
    ).toContainEqual({ id: { in: [] } });
  });

  it('cannot reveal disabled organisations to anonymous callers', () => {
    expect(createOrganizationFilter({ enabled: false }, undefined).AND).toEqual(
      expect.arrayContaining([{ enabled: true }, { enabled: false }])
    );
  });

  it('finds organisations with or without members', () => {
    expect(
      createOrganizationFilter({ hasMembers: true }, crossOrg).AND
    ).toContainEqual({ members: { some: {} } });
    expect(
      createOrganizationFilter({ hasMembers: false }, crossOrg).AND
    ).toContainEqual({ members: { none: {} } });
  });

  it('only lets whoever may update any organisation filter by members', () => {
    expect(() =>
      createOrganizationFilter({ hasMembers: false }, user(['a']))
    ).toThrow(ForbiddenException);
    expect(() =>
      createOrganizationFilter({ hasMembers: true }, undefined)
    ).toThrow(ForbiddenException);
  });

  it('lets whoever may read any organisation filter by sensitive fields', () => {
    expect(
      createOrganizationFilter(
        { hasMembers: true, partner: true, createdByMigration: false },
        crossOrgReader
      ).AND
    ).toEqual(
      expect.arrayContaining([
        { members: { some: {} } },
        { partner: true },
        { createdByMigration: false },
      ])
    );
    expect(
      createOrganizationFilter(
        { partner: false },
        apiKey(CanGetOtherOrganizations.id)
      ).AND
    ).toContainEqual({ partner: false });
  });

  it.each([
    ['partner', { partner: true }],
    ['partner', { partner: false }],
    ['createdByMigration', { createdByMigration: true }],
    ['createdByMigration', { createdByMigration: false }],
  ])('does not let the %s filter reveal sensitive data', (_, filter) => {
    expect(() => createOrganizationFilter(filter, undefined)).toThrow(
      ForbiddenException
    );
    expect(() => createOrganizationFilter(filter, user(['a']))).toThrow(
      ForbiddenException
    );
    expect(() => createOrganizationFilter(filter, apiKey())).toThrow(
      ForbiddenException
    );
  });
});

describe('createOrganizationOrder', () => {
  it('sorts by name, creation or modification', () => {
    expect(
      createOrganizationOrder(OrganizationSort.Name, SortOrder.Ascending)
    ).toEqual({ name: 'asc' });
    expect(
      createOrganizationOrder(OrganizationSort.CreatedAt, SortOrder.Descending)
    ).toEqual({ createdAt: 'desc' });
    expect(
      createOrganizationOrder(OrganizationSort.ModifiedAt, SortOrder.Descending)
    ).toEqual({ modifiedAt: 'desc' });
  });
});

describe('OrganizationService', () => {
  let service: OrganizationService;
  let prisma: any;
  let sessionCache: { invalidate: ReturnType<typeof vi.fn> };
  let publicContentCache: { invalidate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = {
      organization: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(async ({ data }) => organization(data)),
        update: vi.fn(async ({ data }) => organization(data)),
        delete: vi.fn(async () => organization()),
      },
      organizationMember: {
        findUnique: vi.fn(),
        upsert: vi.fn(async ({ create }) => create),
        delete: vi.fn(async ({ where }) => where.userId_organizationId),
      },
      region: { findUnique: vi.fn() },
      user: { findUnique: vi.fn() },
      tag: {
        count: vi.fn(async ({ where }) => where.id.in.length),
      },
      affiliation: {
        count: vi.fn(async ({ where }) => where.id.in.length),
      },
    };
    sessionCache = { invalidate: vi.fn() };
    publicContentCache = { invalidate: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: PrismaClient, useValue: prisma },
        { provide: SessionCacheInvalidator, useValue: sessionCache },
        {
          provide: PublicContentCacheInvalidator,
          useValue: publicContentCache,
        },
        {
          provide: OrganizationDataloaderService,
          useValue: { prime: vi.fn() },
        },
      ],
    }).compile();

    service = await module.resolve(OrganizationService);
  });

  describe('getOrganizations', () => {
    it('pages through organisations', async () => {
      prisma.organization.findMany.mockResolvedValue([
        organization({ id: 'a' }),
        organization({ id: 'b' }),
        organization({ id: 'c' }),
      ]);
      prisma.organization.count.mockResolvedValue(7);

      const result = await service.getOrganizations(
        {
          take: 2,
          skip: 2,
          cursorId: 'cursor',
          sort: OrganizationSort.Name,
          order: SortOrder.Ascending,
        },
        undefined
      );

      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
          skip: 2,
          cursor: { id: 'cursor' },
          orderBy: { name: 'asc' },
        })
      );
      expect(result.nodes.map(({ id }) => id)).toEqual(['a', 'b']);
      expect(result.totalCount).toBe(7);
      expect(result.pageInfo).toEqual({
        hasPreviousPage: true,
        hasNextPage: true,
        startCursor: 'a',
        endCursor: 'b',
      });
    });

    it('caps a page at 100', async () => {
      await service.getOrganizations({ take: 500 }, undefined);

      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 101, cursor: undefined })
      );
    });

    it('scopes the list and the count to what the caller may see', async () => {
      await service.getOrganizations({}, undefined);

      const [{ where }] = prisma.organization.findMany.mock.calls[0];
      expect(where.AND).toContainEqual({ enabled: true });
      expect(prisma.organization.count.mock.calls[0][0].where).toEqual(where);
    });
  });

  describe('getOrganization', () => {
    it('finds a visible organisation by id', async () => {
      prisma.organization.findFirst.mockResolvedValue(organization());

      await expect(
        service.getOrganization({ id: 'org-1' }, undefined)
      ).resolves.toEqual(organization());
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: { AND: [{ id: 'org-1' }, { enabled: true }] },
      });
    });

    it('finds a visible organisation by slug', async () => {
      prisma.organization.findFirst.mockResolvedValue(organization());

      await service.getOrganization({ slug: 'dampfzentrale' }, user(['a']));

      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: {
          AND: [
            { slug: 'dampfzentrale' },
            { OR: [{ enabled: true }, { id: { in: ['a'] } }] },
          ],
        },
      });
    });

    it('does not find what the caller may not see', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);

      await expect(
        service.getOrganization({ id: 'org-1' }, undefined)
      ).rejects.toThrow(NotFoundException);
    });

    it('needs an id or a slug', async () => {
      await expect(service.getOrganization({}, undefined)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('createOrganization', () => {
    it('creates an organisation without marking it as migrated', async () => {
      await service.createOrganization(
        { name: 'Dampfzentrale', city: 'Bern' },
        crossOrg
      );

      const [{ data }] = prisma.organization.create.mock.calls[0];
      expect(data).toEqual({ name: 'Dampfzentrale', city: 'Bern' });
      expect(sessionCache.invalidate).not.toHaveBeenCalled();
    });

    it('makes a creator who may not update every organisation its member', async () => {
      await service.createOrganization({ name: 'Dampfzentrale' }, user([]));

      const [{ data }] = prisma.organization.create.mock.calls[0];
      expect(data.members).toEqual({ create: { userId: 'user-1' } });
      expect(
        prisma.organization.create.mock.invocationCallOrder[0]
      ).toBeLessThan(sessionCache.invalidate.mock.invocationCallOrder[0]);
    });

    it('refuses an api key that could not manage what it creates', async () => {
      await expect(
        service.createOrganization({ name: 'Dampfzentrale' }, apiKey())
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.create).not.toHaveBeenCalled();
    });

    it('refuses an api key even though it acts as its creator, as the key still could not manage it', async () => {
      await expect(
        service.createOrganization({ name: 'Dampfzentrale' }, {
          ...apiKey(),
          user: { id: 'user-1' },
        } as AuthSession)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.create).not.toHaveBeenCalled();
    });

    it('refuses an api key of an organisation, which cannot reach a new one', async () => {
      await expect(
        service.createOrganization(
          { name: 'Dampfzentrale' },
          organizationKey('org-1', CanUpdateOtherOrganizations.id)
        )
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.create).not.toHaveBeenCalled();
    });

    it('only lets whoever may update any organisation set partner or enabled', async () => {
      await expect(
        service.createOrganization({ name: 'A', partner: true }, user([]))
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createOrganization({ name: 'A', enabled: false }, user([]))
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.create).not.toHaveBeenCalled();

      await service.createOrganization(
        { name: 'A', partner: true, enabled: false },
        crossOrg
      );
      expect(prisma.organization.create).toHaveBeenCalledTimes(1);
    });

    it('accepts partner and enabled at their defaults from anyone', async () => {
      await service.createOrganization(
        { name: 'A', partner: false, enabled: true },
        user([])
      );

      expect(prisma.organization.create).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['a blank name', { name: '  ' }],
      ['a name over 100 characters', { name: 'x'.repeat(101) }],
      ['a zip over 4 characters', { name: 'A', zip: '30000' }],
      ['latitude without longitude', { name: 'A', latitude: 46.9 }],
      ['longitude without latitude', { name: 'A', longitude: 7.4 }],
    ])('rejects %s', async (_, input) => {
      await expect(
        service.createOrganization(input as any, crossOrg)
      ).rejects.toThrow(BadRequestException);
      expect(prisma.organization.create).not.toHaveBeenCalled();
    });

    it('accepts a name of exactly 100 characters and a zip of 4', async () => {
      await service.createOrganization(
        { name: 'x'.repeat(100), zip: '3011', latitude: 46.9, longitude: 7.4 },
        crossOrg
      );

      expect(prisma.organization.create).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown region', async () => {
      prisma.region.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrganization({ name: 'A', regionId: 'nope' }, crossOrg)
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a disabled region', async () => {
      prisma.region.findUnique.mockResolvedValue({
        id: 'region-1',
        enabled: false,
      });

      await expect(
        service.createOrganization(
          { name: 'A', regionId: 'region-1' },
          crossOrg
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a slug another organisation uses', async () => {
      prisma.organization.findUnique.mockResolvedValue(
        organization({ id: 'other' })
      );

      await expect(
        service.createOrganization(
          { name: 'A', slug: 'dampfzentrale' },
          crossOrg
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateOrganization', () => {
    beforeEach(() => {
      prisma.organization.findUnique.mockImplementation(
        async ({ where }: Prisma.OrganizationFindUniqueArgs) =>
          where.id === 'org-1' || where.slug === 'dampfzentrale' ?
            organization()
          : null
      );
    });

    it('does not find an unknown organisation', async () => {
      await expect(
        service.updateOrganization({ id: 'nope', name: 'B' }, crossOrg)
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses non-members', async () => {
      await expect(
        service.updateOrganization({ id: 'org-1', name: 'B' }, user(['x']))
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('lets members update their organisation', async () => {
      await service.updateOrganization(
        { id: 'org-1', name: 'B' },
        user(['org-1'])
      );

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { name: 'B' },
      });
      expect(sessionCache.invalidate).not.toHaveBeenCalled();
    });

    it('does not let members change partner or enabled', async () => {
      await expect(
        service.updateOrganization(
          { id: 'org-1', partner: true },
          user(['org-1'])
        )
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateOrganization(
          { id: 'org-1', enabled: false },
          user(['org-1'])
        )
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('lets members resend partner and enabled unchanged', async () => {
      prisma.organization.findUnique.mockResolvedValue(
        organization({ partner: true, enabled: false })
      );

      await service.updateOrganization(
        { id: 'org-1', name: 'B', partner: true, enabled: false },
        user(['org-1'])
      );

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { name: 'B', partner: true, enabled: false },
      });
    });

    it('lets whoever may update any organisation change partner and enabled', async () => {
      await service.updateOrganization(
        { id: 'org-1', partner: true, enabled: false },
        crossOrg
      );

      expect(prisma.organization.update).toHaveBeenCalledTimes(1);
    });

    it('lets an api key of the organisation update it like a member', async () => {
      await service.updateOrganization(
        { id: 'org-1', name: 'B' },
        organizationKey('org-1')
      );

      expect(prisma.organization.update).toHaveBeenCalledTimes(1);
    });

    it('does not let an api key of an organisation change partner, even holding CAN_UPDATE_OTHER_ORGANIZATIONS', async () => {
      await expect(
        service.updateOrganization(
          { id: 'org-1', partner: true },
          organizationKey('org-1', CanUpdateOtherOrganizations.id)
        )
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('does not let an api key of an organisation update another one', async () => {
      await expect(
        service.updateOrganization(
          { id: 'org-1', name: 'B' },
          organizationKey('org-2', CanUpdateOtherOrganizations.id)
        )
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('keeps an existing disabled region', async () => {
      prisma.organization.findUnique.mockResolvedValue(
        organization({ regionId: 'region-1' })
      );
      prisma.region.findUnique.mockResolvedValue({
        id: 'region-1',
        enabled: false,
      });

      await service.updateOrganization(
        { id: 'org-1', regionId: 'region-1', name: 'B' },
        user(['org-1'])
      );

      expect(prisma.organization.update).toHaveBeenCalledTimes(1);
    });

    it('refuses to move into a disabled region', async () => {
      prisma.region.findUnique.mockResolvedValue({
        id: 'region-2',
        enabled: false,
      });

      await expect(
        service.updateOrganization(
          { id: 'org-1', regionId: 'region-2' },
          user(['org-1'])
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('checks coordinates against what is stored', async () => {
      prisma.organization.findUnique.mockResolvedValue(
        organization({ latitude: 46.9, longitude: null })
      );

      await service.updateOrganization(
        { id: 'org-1', longitude: 7.4 },
        user(['org-1'])
      );
      expect(prisma.organization.update).toHaveBeenCalledTimes(1);

      prisma.organization.findUnique.mockResolvedValue(
        organization({ latitude: 46.9, longitude: 7.4 })
      );
      await expect(
        service.updateOrganization(
          { id: 'org-1', latitude: null },
          user(['org-1'])
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('keeps its own slug', async () => {
      await service.updateOrganization(
        { id: 'org-1', slug: 'dampfzentrale' },
        user(['org-1'])
      );

      expect(prisma.organization.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteOrganization', () => {
    beforeEach(() => {
      prisma.organization.findUnique.mockImplementation(
        async ({ where }: Prisma.OrganizationFindUniqueArgs) =>
          where.id === 'org-1' ? organization() : null
      );
    });

    it('refuses non-members', async () => {
      await expect(
        service.deleteOrganization('org-1', user(['x']))
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.organization.delete).not.toHaveBeenCalled();
    });

    it('deletes, then drops cached sessions that still list the organisation', async () => {
      await service.deleteOrganization('org-1', user(['org-1']));

      expect(prisma.organization.delete).toHaveBeenCalledWith({
        where: { id: 'org-1' },
      });
      expect(
        prisma.organization.delete.mock.invocationCallOrder[0]
      ).toBeLessThan(sessionCache.invalidate.mock.invocationCallOrder[0]);
    });

    it('does not find an unknown organisation', async () => {
      await expect(
        service.deleteOrganization('nope', crossOrg)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addOrganizationMember', () => {
    it('does not find an unknown organisation or user', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2' });

      await expect(
        service.addOrganizationMember({
          organizationId: 'nope',
          userId: 'user-2',
        })
      ).rejects.toThrow(NotFoundException);

      prisma.organization.findUnique.mockResolvedValue(organization());
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addOrganizationMember({
          organizationId: 'org-1',
          userId: 'nope',
        })
      ).rejects.toThrow(NotFoundException);
      expect(prisma.organizationMember.upsert).not.toHaveBeenCalled();
      expect(sessionCache.invalidate).not.toHaveBeenCalled();
    });

    it('adds the member, then drops cached sessions', async () => {
      prisma.organization.findUnique.mockResolvedValue(organization());
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2' });

      await service.addOrganizationMember({
        organizationId: 'org-1',
        userId: 'user-2',
      });

      expect(prisma.organizationMember.upsert).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 'user-2',
            organizationId: 'org-1',
          },
        },
        create: { userId: 'user-2', organizationId: 'org-1' },
        update: {},
      });
      expect(
        prisma.organizationMember.upsert.mock.invocationCallOrder[0]
      ).toBeLessThan(sessionCache.invalidate.mock.invocationCallOrder[0]);
    });
  });

  describe('removeOrganizationMember', () => {
    it('removes the member, then drops cached sessions', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        userId: 'user-2',
        organizationId: 'org-1',
      });

      await service.removeOrganizationMember({
        organizationId: 'org-1',
        userId: 'user-2',
      });

      expect(prisma.organizationMember.delete).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 'user-2',
            organizationId: 'org-1',
          },
        },
      });
      expect(
        prisma.organizationMember.delete.mock.invocationCallOrder[0]
      ).toBeLessThan(sessionCache.invalidate.mock.invocationCallOrder[0]);
    });

    it('does not find a membership that does not exist', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.removeOrganizationMember({
          organizationId: 'org-1',
          userId: 'user-2',
        })
      ).rejects.toThrow(NotFoundException);
      expect(prisma.organizationMember.delete).not.toHaveBeenCalled();
      expect(sessionCache.invalidate).not.toHaveBeenCalled();
    });
  });

  describe('tags, affiliations and contacts', () => {
    const kasse = { label: 'Kasse', email: 'kasse@dampfzentrale.ch' };

    beforeEach(() => {
      prisma.organization.findUnique.mockImplementation(
        async ({ where }: Prisma.OrganizationFindUniqueArgs) =>
          where.id === 'org-1' ? organization() : null
      );
    });

    it('creates an organisation with its tags, affiliations and contacts', async () => {
      await service.createOrganization(
        {
          name: 'Dampfzentrale',
          tagIds: ['tag-1', 'tag-2'],
          affiliationIds: ['aff-1'],
          contacts: [kasse, { phone: ' 031 311 05 05 ', email: '' }],
        },
        crossOrg
      );

      const [{ data }] = prisma.organization.create.mock.calls[0];
      expect(data.tags).toEqual({
        createMany: { data: [{ tagId: 'tag-1' }, { tagId: 'tag-2' }] },
      });
      expect(data.affiliations).toEqual({
        createMany: { data: [{ affiliationId: 'aff-1' }] },
      });
      expect(data.contacts).toEqual({
        createMany: {
          data: [
            { label: 'Kasse', email: 'kasse@dampfzentrale.ch', phone: null },
            { label: null, email: null, phone: '031 311 05 05' },
          ],
        },
      });
      expect(prisma.tag.count).toHaveBeenCalledWith({
        where: { id: { in: ['tag-1', 'tag-2'] }, type: 'Event' },
      });
    });

    it('refuses tags that are not existing event tags', async () => {
      prisma.tag.count.mockResolvedValue(1);

      await expect(
        service.createOrganization(
          { name: 'Dampfzentrale', tagIds: ['tag-1', 'article-tag'] },
          crossOrg
        )
      ).rejects.toThrow(BadRequestException);
      expect(prisma.organization.create).not.toHaveBeenCalled();
    });

    it('refuses an unknown affiliation', async () => {
      prisma.affiliation.count.mockResolvedValue(0);

      await expect(
        service.updateOrganization(
          { id: 'org-1', affiliationIds: ['nope'] },
          crossOrg
        )
      ).rejects.toThrow(BadRequestException);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it.each([
      ['four tags', { tagIds: ['a', 'b', 'c', 'd'] }],
      ['a repeated tag', { tagIds: ['a', 'a'] }],
      ['a repeated affiliation', { affiliationIds: ['a', 'a'] }],
      ['seven contacts', { contacts: Array.from({ length: 7 }, () => kasse) }],
      [
        'a contact with neither email nor phone',
        { contacts: [{ label: 'X' }] },
      ],
      ['an email that is not one', { contacts: [{ email: 'foo@' }] }],
      [
        'a label of 25 characters',
        { contacts: [{ ...kasse, label: 'a'.repeat(25) }] },
      ],
    ])('refuses %s', async (_, input) => {
      await expect(
        service.updateOrganization({ id: 'org-1', ...input }, crossOrg)
      ).rejects.toThrow(BadRequestException);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('replaces tags, affiliations and contacts wholesale', async () => {
      await service.updateOrganization(
        {
          id: 'org-1',
          tagIds: ['tag-3'],
          affiliationIds: [],
          contacts: [kasse],
        },
        crossOrg
      );

      const [{ data }] = prisma.organization.update.mock.calls[0];
      expect(data.tags).toEqual({
        deleteMany: {},
        createMany: { data: [{ tagId: 'tag-3' }] },
      });
      expect(data.affiliations).toEqual({
        deleteMany: {},
        createMany: { data: [] },
      });
      expect(data.contacts).toEqual({
        deleteMany: {},
        createMany: {
          data: [
            { label: 'Kasse', email: 'kasse@dampfzentrale.ch', phone: null },
          ],
        },
      });
    });

    it('leaves them untouched when the fields are left out or null', async () => {
      await service.updateOrganization(
        { id: 'org-1', name: 'B', tagIds: null, contacts: null },
        crossOrg
      );

      const [{ data }] = prisma.organization.update.mock.calls[0];
      expect(data).toEqual({ name: 'B' });
      expect(prisma.tag.count).not.toHaveBeenCalled();
      expect(prisma.affiliation.count).not.toHaveBeenCalled();
    });

    it('lets a member change them on their own organisation', async () => {
      await service.updateOrganization(
        {
          id: 'org-1',
          tagIds: ['tag-1'],
          affiliationIds: ['aff-1'],
          contacts: [kasse],
        },
        user(['org-1'])
      );

      expect(prisma.organization.update).toHaveBeenCalled();
    });

    it('refuses a non-member without CAN_UPDATE_OTHER_ORGANIZATIONS', async () => {
      await expect(
        service.updateOrganization(
          { id: 'org-1', tagIds: ['tag-1'] },
          user(['org-2'], CanGetOtherOrganizations.id)
        )
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.tag.count).not.toHaveBeenCalled();
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('resets the events cache after an update, which shows the organisation', async () => {
      await service.updateOrganization(
        { id: 'org-1', tagIds: ['tag-1'] },
        crossOrg
      );

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('events');
      expect(
        prisma.organization.update.mock.invocationCallOrder[0]
      ).toBeLessThan(publicContentCache.invalidate.mock.invocationCallOrder[0]);
    });

    it('resets the events cache after a delete', async () => {
      await service.deleteOrganization('org-1', crossOrg);

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('events');
    });
  });
});
