import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import {
  CanGetOtherOrganizations,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import { EventTaxonomyService } from './event-taxonomy.service';

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

const organizationKey = (...permissions: string[]): AuthSession => ({
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Venue app',
  token: 'token',
  permissions,
  organizationId: 'org-a',
});

const BY_NAME = [{ name: 'asc' }, { id: 'asc' }];

describe('EventTaxonomyService', () => {
  let service: EventTaxonomyService;
  const prisma = {
    region: { findMany: vi.fn().mockResolvedValue([]) },
    audience: { findMany: vi.fn().mockResolvedValue([]) },
    affiliation: { findMany: vi.fn().mockResolvedValue([]) },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        EventTaxonomyService,
        { provide: PrismaClient, useValue: prisma },
      ],
    }).compile();

    service = module.get(EventTaxonomyService);
  });

  it.each([
    ['nobody', undefined],
    ['a member', user(['org-a'])],
    [
      'a bound key, whatever its scopes',
      organizationKey(CanGetOtherOrganizations.id),
    ],
  ])('hides disabled regions from %s', async (_name, session) => {
    await service.getRegions(session);

    expect(prisma.region.findMany).toHaveBeenCalledWith({
      where: { enabled: true },
      orderBy: BY_NAME,
    });
  });

  it.each([
    ['CAN_GET_OTHER_ORGANIZATIONS', user([], CanGetOtherOrganizations.id)],
    [
      'CAN_UPDATE_OTHER_ORGANIZATIONS',
      user([], CanUpdateOtherOrganizations.id),
    ],
  ])('shows disabled regions to %s', async (_name, session) => {
    await service.getRegions(session);

    expect(prisma.region.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: BY_NAME,
    });
  });

  it('lists audiences by name', async () => {
    prisma.audience.findMany.mockResolvedValueOnce([
      { id: 'a', name: 'Kinder' },
    ]);

    await expect(service.getAudiences()).resolves.toEqual([
      { id: 'a', name: 'Kinder' },
    ]);
    expect(prisma.audience.findMany).toHaveBeenCalledWith({ orderBy: BY_NAME });
  });

  it('lists affiliations by name', async () => {
    await service.getAffiliations();

    expect(prisma.affiliation.findMany).toHaveBeenCalledWith({
      orderBy: BY_NAME,
    });
  });
});
