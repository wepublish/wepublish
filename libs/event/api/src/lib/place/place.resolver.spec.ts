import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { ONE_OF_METADATA_KEY } from '@wepublish/nest-modules';
import {
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import {
  PERMISSIONS_METADATA_KEY,
  PermissionsGuard,
} from '@wepublish/permissions/api';
import request from 'supertest';
import { OrganizationDataloaderService } from '../organization/organization-dataloader.service';
import { RegionDataloader } from '../taxonomy/event-taxonomy.dataloader';
import { PlaceResolver } from './place.resolver';
import { PlaceService } from './place.service';

const member: AuthSession = {
  type: AuthSessionType.User,
  id: 'session-1',
  token: 'token',
  user: { id: 'user-1' },
  roles: [],
  organizationIds: ['org-a'],
  createdAt: new Date(),
  expiresAt: new Date(),
} as unknown as AuthSession;

const sessionWith = (
  organizationIds: string[],
  ...permissionIDs: string[]
): AuthSession =>
  ({
    ...member,
    roles: [{ id: 'role', permissionIDs }],
    organizationIds,
  }) as unknown as AuthSession;

const sessions: Record<string, AuthSession | undefined> = {
  member,
  organiser: sessionWith(['org-a'], CanUpdateOrganization.id),
  stranger: sessionWith(['org-b'], CanUpdateOrganization.id),
  crossOrg: sessionWith(
    [],
    CanUpdateOrganization.id,
    CanUpdateOtherOrganizations.id
  ),
};

const place = {
  id: 'place-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Dampfzentrale',
  slug: 'dampfzentrale',
  enabled: true,
  private: true,
  address: 'Marzilistrasse 47',
  zip: '3005',
  city: 'Bern',
  latitude: 46.944,
  longitude: 7.446,
  about: null,
  capacity: '400',
  website: null,
  wheelchairAccessible: true,
  wheelchairAccessibleToilets: false,
  wheelchairAccessibleParking: false,
  proInfirmisIdSource: null,
  proInfirmisDetailUrl: null,
  proInfirmisPictograms: [1, 4],
  regionId: 'region-1',
  organizationId: 'org-a',
  legacyId: BigInt(7),
};

const MUTATIONS = ['createPlace', 'updatePlace', 'deletePlace'];

const handler = (name: string) => (PlaceResolver.prototype as any)[name];

describe('PlaceResolver authorisation wiring', () => {
  it.each(['place', 'places'])('%s is public', name => {
    expect(Reflect.getMetadata('public', handler(name))).toBe(true);
  });

  it.each(MUTATIONS)('%s needs CAN_UPDATE_ORGANIZATION', name => {
    expect(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler(name))
    ).toEqual([CanUpdateOrganization]);
    expect(Reflect.getMetadata(ONE_OF_METADATA_KEY, handler(name))).toContain(
      PermissionsGuard
    );
    expect(Reflect.getMetadata('public', handler(name))).toBeFalsy();
  });

  it('wires every operation the resolver exposes, with none forgotten', () => {
    const own = Object.getOwnPropertyNames(PlaceResolver.prototype).filter(
      name => name !== 'constructor' && typeof handler(name) === 'function'
    );

    expect(own.sort()).toEqual(
      [
        'place',
        'places',
        'region',
        'organization',
        'viewerCan',
        ...MUTATIONS,
      ].sort()
    );
  });
});

describe('PlaceResolver', () => {
  let app: INestApplication;
  const service = {
    getPlace: vi.fn(),
    getPlaces: vi.fn(),
    createPlace: vi.fn(),
    updatePlace: vi.fn(),
    deletePlace: vi.fn(),
  };
  const regions = { load: vi.fn() };
  const organizations = { load: vi.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: ({ req }: { req: unknown }) => ({ req }),
        }),
      ],
      providers: [
        PlaceResolver,
        { provide: PlaceService, useValue: service },
        { provide: RegionDataloader, useValue: regions },
        { provide: OrganizationDataloaderService, useValue: organizations },
      ],
    }).compile();

    app = module.createNestApplication();
    app.use((req: any, _res: unknown, next: () => void) => {
      req.user = sessions[req.headers['x-session'] as string];
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service.getPlace.mockResolvedValue(place);
    regions.load.mockResolvedValue({
      id: 'region-1',
      name: 'Bern',
      slug: 'bern',
      enabled: true,
    });
  });

  const send = (query: string, headers: Record<string, string> = {}) =>
    request(app.getHttpServer()).post('/').set(headers).send({ query });

  const placeQuery = `
    query {
      place(slug: "dampfzentrale") {
        id
        name
        private
        capacity
        wheelchairAccessible
        proInfirmisPictograms
        region { id name }
        organization { __typename id name }
      }
    }
  `;

  it('resolves a place with its region and its organisation', async () => {
    organizations.load.mockResolvedValue({
      id: 'org-a',
      name: 'Dampfzentrale Bern',
      enabled: true,
    });

    const res = await send(placeQuery).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.place).toEqual({
      id: 'place-1',
      name: 'Dampfzentrale',
      private: true,
      capacity: '400',
      wheelchairAccessible: true,
      proInfirmisPictograms: [1, 4],
      region: { id: 'region-1', name: 'Bern' },
      organization: {
        __typename: 'Organization',
        id: 'org-a',
        name: 'Dampfzentrale Bern',
      },
    });
    expect(service.getPlace).toHaveBeenCalledWith(
      { slug: 'dampfzentrale' },
      undefined
    );
    expect(regions.load).toHaveBeenCalledWith('region-1');
    expect(organizations.load).toHaveBeenCalledWith('org-a');
  });

  it('hides a disabled organisation from the public and shows it to its members', async () => {
    organizations.load.mockResolvedValue({
      id: 'org-a',
      name: 'Dampfzentrale Bern',
      enabled: false,
    });

    const anonymous = await send(placeQuery).expect(200);
    const asMember = await send(placeQuery, { 'x-session': 'member' }).expect(
      200
    );

    expect(anonymous.body.data.place.organization).toBeNull();
    expect(asMember.body.data.place.organization).toEqual({
      __typename: 'SensitiveDataOrganization',
      id: 'org-a',
      name: 'Dampfzentrale Bern',
    });
  });

  it('gives a place without region or organisation nulls', async () => {
    service.getPlace.mockResolvedValue({
      ...place,
      regionId: null,
      organizationId: null,
    });

    const res = await send(placeQuery).expect(200);

    expect(res.body.data.place).toMatchObject({
      region: null,
      organization: null,
    });
    expect(regions.load).not.toHaveBeenCalled();
    expect(organizations.load).not.toHaveBeenCalled();
  });

  it('passes the list arguments and the session on', async () => {
    service.getPlaces.mockResolvedValue({
      nodes: [place],
      totalCount: 1,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: 'place-1',
        endCursor: 'place-1',
      },
    });

    const res = await send(
      `query { places(filter: { selectable: true }) { nodes { id } totalCount } }`,
      { 'x-session': 'member' }
    ).expect(200);

    expect(res.body.data.places).toEqual({
      nodes: [{ id: 'place-1' }],
      totalCount: 1,
    });
    expect(service.getPlaces).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { selectable: true },
        sort: 'Name',
        order: 'Ascending',
        take: 10,
        skip: 0,
      }),
      member
    );
  });

  it('passes the session on to every write', async () => {
    service.createPlace.mockResolvedValue(place);
    service.updatePlace.mockResolvedValue(place);
    service.deletePlace.mockResolvedValue(place);

    await send(
      `mutation { createPlace(name: "D", address: "A", zip: "3005", city: "Bern", organizationId: "org-a") { id } }`,
      { 'x-session': 'member' }
    ).expect(200);
    await send(`mutation { updatePlace(id: "place-1", name: "E") { id } }`, {
      'x-session': 'member',
    }).expect(200);
    await send(`mutation { deletePlace(id: "place-1") { id } }`, {
      'x-session': 'member',
    }).expect(200);

    expect(service.createPlace).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'D', organizationId: 'org-a' }),
      member
    );
    expect(service.updatePlace).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'place-1', name: 'E' }),
      member
    );
    expect(service.deletePlace).toHaveBeenCalledWith('place-1', member);
  });

  it.each<[string, string | undefined, string | null, boolean]>([
    ['an anonymous caller', undefined, 'org-a', false],
    ['a member without CAN_UPDATE_ORGANIZATION', 'member', 'org-a', false],
    ['a member with it', 'organiser', 'org-a', true],
    ['a non-member', 'stranger', 'org-a', false],
    ['a member, for a place without organisation', 'organiser', null, false],
    ['a cross-organisation editor', 'crossOrg', 'org-a', true],
    [
      'a cross-organisation editor, for a place without organisation',
      'crossOrg',
      null,
      true,
    ],
  ])(
    'tells %s whether it may update and delete the place',
    async (_, session, organizationId, may) => {
      service.getPlace.mockResolvedValue({ ...place, organizationId });

      const res = await send(
        `query { place(id: "place-1") { viewerCan { update delete } } }`,
        session ? { 'x-session': session } : {}
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.place.viewerCan).toEqual({
        update: may,
        delete: may,
      });
    }
  );
});
