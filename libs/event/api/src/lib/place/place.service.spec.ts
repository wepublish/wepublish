import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Place, PrismaClient } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import {
  CanGetOtherOrganizations,
  CanUpdateOtherOrganizationEvents,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import { SortOrder } from '@wepublish/utils/api';
import { PlaceDataloaderService } from './place-dataloader.service';
import { CreatePlaceInput, PlaceSort } from './place.model';
import { PlaceService } from './place.service';

const NOW = new Date('2026-10-23T10:00:00.000Z');

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
    createdAt: NOW,
    expiresAt: NOW,
  }) as AuthSession;

const organizationKey = (
  organizationId: string,
  ...permissions: string[]
): AuthSession => ({
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Venue app',
  token: 'token',
  permissions,
  organizationId,
});

const member = user(['org-a']);
const stranger = user(['org-b']);
const admin = user([], CanUpdateOtherOrganizations.id);

const placeRow = (overrides: Partial<Place> = {}): Place => ({
  id: 'place-1',
  createdAt: NOW,
  modifiedAt: NOW,
  name: 'Dampfzentrale',
  slug: 'dampfzentrale',
  enabled: true,
  private: false,
  address: 'Marzilistrasse 47',
  zip: '3005',
  city: 'Bern',
  latitude: 46.944,
  longitude: 7.446,
  about: null,
  capacity: null,
  website: null,
  wheelchairAccessible: false,
  wheelchairAccessibleToilets: false,
  wheelchairAccessibleParking: false,
  proInfirmisIdSource: null,
  proInfirmisDetailUrl: null,
  proInfirmisPictograms: null,
  regionId: null,
  organizationId: 'org-a',
  legacyId: null,
  ...overrides,
});

const input = (
  overrides: Partial<CreatePlaceInput> = {}
): CreatePlaceInput => ({
  name: 'Dampfzentrale',
  address: 'Marzilistrasse 47',
  zip: '3005',
  city: 'Bern',
  organizationId: 'org-a',
  ...overrides,
});

const setup = async () => {
  const prisma: any = {
    place: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(async ({ data }) => placeRow(data)),
      update: vi.fn(async ({ data }) => placeRow(data)),
      delete: vi.fn(async () => placeRow()),
    },
    region: { findUnique: vi.fn() },
    organization: {
      findUnique: vi.fn(async ({ where }) => ({ id: where.id })),
    },
    event: { count: vi.fn().mockResolvedValue(0) },
  };
  const cache = { invalidate: vi.fn(), invalidateDraft: vi.fn() };

  const module = await Test.createTestingModule({
    providers: [
      PlaceService,
      { provide: PrismaClient, useValue: prisma },
      { provide: PublicContentCacheInvalidator, useValue: cache },
      { provide: PlaceDataloaderService, useValue: { prime: vi.fn() } },
    ],
  }).compile();

  return { service: module.get(PlaceService), prisma, cache };
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PlaceService.getPlace', () => {
  it('needs an id or a slug', async () => {
    const { service } = await setup();

    await expect(service.getPlace({}, undefined)).rejects.toThrow(
      BadRequestException
    );
  });

  it.each([
    ['nobody', undefined, { enabled: true }],
    [
      'a member',
      member,
      { OR: [{ enabled: true }, { organizationId: { in: ['org-a'] } }] },
    ],
    ['CAN_GET_OTHER_ORGANIZATIONS', user([], CanGetOtherOrganizations.id), {}],
  ])(
    'looks the place up within what %s may see',
    async (_n, session, scope) => {
      const { service, prisma } = await setup();
      prisma.place.findFirst.mockResolvedValue(placeRow());

      await service.getPlace({ slug: 'dampfzentrale' }, session);

      expect(prisma.place.findFirst).toHaveBeenCalledWith({
        where: { AND: [{ slug: 'dampfzentrale' }, scope] },
      });
    }
  );

  it('is NotFound for a place outside the scope', async () => {
    const { service, prisma } = await setup();
    prisma.place.findFirst.mockResolvedValue(null);

    await expect(
      service.getPlace({ id: 'place-1' }, undefined)
    ).rejects.toThrow(NotFoundException);
  });
});

describe('PlaceService.getPlaces', () => {
  it('scopes the list and pages with five slots', async () => {
    const { service, prisma } = await setup();
    prisma.place.count.mockResolvedValue(3);
    prisma.place.findMany.mockResolvedValue([
      placeRow({ id: 'p-1' }),
      placeRow({ id: 'p-2' }),
      placeRow({ id: 'p-3' }),
    ]);

    const result = await service.getPlaces(
      {
        take: 2,
        skip: 0,
        sort: PlaceSort.Name,
        order: SortOrder.Ascending,
      },
      undefined
    );

    expect(prisma.place.findMany).toHaveBeenCalledWith({
      where: { AND: [{ enabled: true }] },
      skip: 0,
      take: 3,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      cursor: undefined,
    });
    expect(result.nodes.map(({ id }) => id)).toEqual(['p-1', 'p-2']);
    expect(result.totalCount).toBe(3);
    expect(result.pageInfo).toEqual({
      hasPreviousPage: false,
      hasNextPage: true,
      startCursor: 'p-1',
      endCursor: 'p-2',
    });
  });

  it.each([
    [PlaceSort.CreatedAt, SortOrder.Descending, 'createdAt', 'desc'],
    [PlaceSort.ModifiedAt, SortOrder.Ascending, 'modifiedAt', 'asc'],
  ] as const)('sorts by %s', async (sort, order, column, direction) => {
    const { service, prisma } = await setup();

    await service.getPlaces({ sort, order }, undefined);

    expect(prisma.place.findMany.mock.calls[0][0].orderBy).toEqual([
      { [column]: direction },
      { id: direction },
    ]);
  });

  it('turns every filter into a clause', async () => {
    const { service, prisma } = await setup();

    await service.getPlaces(
      {
        filter: {
          search: 'zentrale',
          regionId: 'region-1',
          organizationId: 'org-a',
          enabled: false,
          selectable: true,
          geoBoundingBox: {
            southWest: { latitude: 46.9, longitude: 7.3 },
            northEast: { latitude: 47.0, longitude: 7.5 },
          },
        },
      },
      member
    );

    expect(prisma.place.findMany.mock.calls[0][0].where).toEqual({
      AND: [
        { OR: [{ enabled: true }, { organizationId: { in: ['org-a'] } }] },
        { name: { contains: 'zentrale', mode: 'insensitive' } },
        { regionId: 'region-1' },
        { organizationId: 'org-a' },
        { enabled: false },
        {
          enabled: true,
          OR: [{ private: false }, { organizationId: { in: ['org-a'] } }],
        },
        {
          latitude: { gte: 46.9, lte: 47.0 },
          longitude: { gte: 7.3, lte: 7.5 },
        },
      ],
    });
  });

  it('offers a stranger no private and no disabled place as selectable', async () => {
    const { service, prisma } = await setup();

    await service.getPlaces({ filter: { selectable: true } }, stranger);

    expect(prisma.place.findMany.mock.calls[0][0].where.AND).toContainEqual({
      enabled: true,
      OR: [{ private: false }, { organizationId: { in: ['org-b'] } }],
    });
  });

  it('rejects a bounding box with only one corner', async () => {
    const { service } = await setup();

    await expect(
      service.getPlaces(
        {
          filter: {
            geoBoundingBox: {
              southWest: { latitude: 46.9, longitude: 7.3 },
            } as any,
          },
        },
        undefined
      )
    ).rejects.toThrow(BadRequestException);
  });
});

describe('PlaceService.createPlace', () => {
  it('lets a member create a place of their organisation and resets the event cache', async () => {
    const { service, prisma, cache } = await setup();

    await service.createPlace(input(), member);

    expect(prisma.place.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Dampfzentrale',
        organizationId: 'org-a',
      }),
    });
    expect(cache.invalidate).toHaveBeenCalledWith('events');
  });

  it('lets an api key bound to the organisation create a place', async () => {
    const { service, prisma } = await setup();

    await service.createPlace(input(), organizationKey('org-a'));

    expect(prisma.place.create).toHaveBeenCalled();
  });

  it.each([
    ['a member of another organisation', stranger, 'org-a'],
    ['a member, without organisation', member, null],
    [
      'a bound key of another organisation, whatever its scopes',
      organizationKey('org-b', CanUpdateOtherOrganizations.id),
      'org-a',
    ],
    [
      'CAN_UPDATE_OTHER_ORGANIZATION_EVENTS, which is about events',
      user([], CanUpdateOtherOrganizationEvents.id),
      'org-a',
    ],
  ])('refuses %s', async (_n, session, organizationId) => {
    const { service, prisma, cache } = await setup();

    await expect(
      service.createPlace(input({ organizationId }), session)
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.place.create).not.toHaveBeenCalled();
    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it.each([
    ['any organisation', 'org-z'],
    ['no organisation', null],
  ])(
    'lets CAN_UPDATE_OTHER_ORGANIZATIONS use %s',
    async (_n, organizationId) => {
      const { service, prisma } = await setup();

      await service.createPlace(input({ organizationId }), admin);

      expect(prisma.place.create).toHaveBeenCalled();
    }
  );

  it('refuses an organisation that does not exist', async () => {
    const { service, prisma } = await setup();
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(
      service.createPlace(input({ organizationId: 'org-z' }), admin)
    ).rejects.toThrow(BadRequestException);
  });

  it.each([
    ['a blank name', { name: '  ' }],
    ['a name over 90 characters', { name: 'x'.repeat(91) }],
    ['a blank address', { address: ' ' }],
    ['a blank zip', { zip: '' }],
    ['a blank city', { city: ' ' }],
    ['a five-character zip', { zip: '30050' }],
    ['latitude without longitude', { latitude: 46.9 }],
    ['longitude without latitude', { longitude: 7.4 }],
  ])('rejects %s', async (_n, overrides) => {
    const { service, prisma } = await setup();

    await expect(service.createPlace(input(overrides), member)).rejects.toThrow(
      BadRequestException
    );
    expect(prisma.place.create).not.toHaveBeenCalled();
  });

  it('accepts a name of 90 characters', async () => {
    const { service, prisma } = await setup();

    await service.createPlace(input({ name: 'x'.repeat(90) }), member);

    expect(prisma.place.create).toHaveBeenCalled();
  });

  it('refuses a disabled region, as organisations do', async () => {
    const { service, prisma } = await setup();
    prisma.region.findUnique.mockResolvedValue({
      id: 'region-1',
      enabled: false,
    });

    await expect(
      service.createPlace(input({ regionId: 'region-1' }), member)
    ).rejects.toThrow('does not accept new places');
  });

  it('refuses a region that does not exist', async () => {
    const { service, prisma } = await setup();
    prisma.region.findUnique.mockResolvedValue(null);

    await expect(
      service.createPlace(input({ regionId: 'region-x' }), member)
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses a slug another place uses', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow({ id: 'place-2' }));

    await expect(
      service.createPlace(input({ slug: 'dampfzentrale' }), member)
    ).rejects.toThrow(BadRequestException);
  });
});

describe('PlaceService.updatePlace', () => {
  it('lets a member update a place of their organisation and resets the event cache', async () => {
    const { service, prisma, cache } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());

    await service.updatePlace({ id: 'place-1', name: 'Dampfi' }, member);

    expect(prisma.place.update).toHaveBeenCalledWith({
      where: { id: 'place-1' },
      data: expect.objectContaining({ name: 'Dampfi' }),
    });
    expect(cache.invalidate).toHaveBeenCalledWith('events');
  });

  it('is NotFound for a missing place', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(null);

    await expect(service.updatePlace({ id: 'place-x' }, admin)).rejects.toThrow(
      NotFoundException
    );
  });

  it.each([
    ['a member of another organisation', stranger, 'org-a'],
    ['a member, for a place without organisation', member, null],
  ])('refuses %s', async (_n, session, organizationId) => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow({ organizationId }));

    await expect(
      service.updatePlace({ id: 'place-1', name: 'Dampfi' }, session)
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.place.update).not.toHaveBeenCalled();
  });

  it('lets CAN_UPDATE_OTHER_ORGANIZATIONS update a place without organisation', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(
      placeRow({ organizationId: null })
    );

    await service.updatePlace({ id: 'place-1', name: 'Dampfi' }, admin);

    expect(prisma.place.update).toHaveBeenCalled();
  });

  it('refuses moving a place into an organisation the member does not belong to', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());

    await expect(
      service.updatePlace({ id: 'place-1', organizationId: 'org-b' }, member)
    ).rejects.toThrow(ForbiddenException);
  });

  it('refuses a member taking a place out of every organisation', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());

    await expect(
      service.updatePlace({ id: 'place-1', organizationId: null }, member)
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets a member of both organisations move the place', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());

    await service.updatePlace(
      { id: 'place-1', organizationId: 'org-b' },
      user(['org-a', 'org-b'])
    );

    expect(prisma.place.update.mock.calls[0][0].data.organizationId).toBe(
      'org-b'
    );
  });

  it('validates the stored values merged with the update', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());

    await expect(
      service.updatePlace({ id: 'place-1', latitude: null }, member)
    ).rejects.toThrow('Latitude and longitude must be given together.');
    await expect(
      service.updatePlace({ id: 'place-1', zip: '12345' }, member)
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps a stored region that was disabled since', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(
      placeRow({ regionId: 'region-1' })
    );

    await service.updatePlace(
      { id: 'place-1', regionId: 'region-1', name: 'Dampfi' },
      member
    );

    expect(prisma.region.findUnique).not.toHaveBeenCalled();
    expect(prisma.place.update).toHaveBeenCalled();
  });

  it('keeps its own slug', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());

    await service.updatePlace({ id: 'place-1', slug: 'dampfzentrale' }, member);

    expect(prisma.place.update).toHaveBeenCalled();
  });
});

describe('PlaceService.deletePlace', () => {
  it('lets a member delete a place of their organisation and resets the event cache', async () => {
    const { service, prisma, cache } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());

    await service.deletePlace('place-1', member);

    expect(prisma.place.delete).toHaveBeenCalledWith({
      where: { id: 'place-1' },
    });
    expect(cache.invalidate).toHaveBeenCalledWith('events');
  });

  it('refuses a member of another organisation', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());

    await expect(service.deletePlace('place-1', stranger)).rejects.toThrow(
      ForbiddenException
    );
    expect(prisma.place.delete).not.toHaveBeenCalled();
  });

  it('refuses a place that still has upcoming events, as BKa does', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(placeRow());
    prisma.event.count.mockResolvedValue(2);

    await expect(service.deletePlace('place-1', admin)).rejects.toThrow(
      BadRequestException
    );
    expect(prisma.event.count).toHaveBeenCalledWith({
      where: {
        placeId: 'place-1',
        occurrences: { some: { dateTo: { gte: NOW } } },
      },
    });
    expect(prisma.place.delete).not.toHaveBeenCalled();
  });

  it('is NotFound for a missing place', async () => {
    const { service, prisma } = await setup();
    prisma.place.findUnique.mockResolvedValue(null);

    await expect(service.deletePlace('place-x', admin)).rejects.toThrow(
      NotFoundException
    );
  });
});
