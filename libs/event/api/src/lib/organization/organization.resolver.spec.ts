import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import {
  AuthSession,
  AuthSessionType,
  PublicGuard,
} from '@wepublish/authentication/api';
import { ONE_OF_METADATA_KEY, OneOfGuard } from '@wepublish/nest-modules';
import {
  CanCreateOrganization,
  CanDeleteOrganization,
  CanGetOtherOrganizationEvents,
  CanGetOtherOrganizations,
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import {
  PERMISSIONS_METADATA_KEY,
  PermissionsGuard,
} from '@wepublish/permissions/api';
import { UserDataloaderService } from '@wepublish/user/api';
import request from 'supertest';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import { OrganizationMemberResolver } from './organization-member.resolver';
import { OrganizationMembersDataloader } from './organization-members.dataloader';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationService } from './organization.service';
import { SensitiveDataOrganizationResolver } from './sensitive-data-organization.resolver';

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

const organization = {
  id: 'org-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Dampfzentrale',
  slug: 'dampfzentrale',
  subTitle: 'Tanz und Musik',
  about: 'Kulturzentrum an der Aare',
  website: 'https://dampfzentrale.ch',
  legalStatus: 'association',
  enabled: true,
  partner: true,
  createdByMigration: true,
  address: 'Marzilistrasse 47',
  postOfficeBox: 'Postfach 165',
  zip: '3005',
  city: 'Bern',
  latitude: 46.944,
  longitude: 7.446,
  regionId: 'region-1',
};

const otherOrganization = {
  ...organization,
  id: 'org-2',
  name: 'Reitschule',
  slug: 'reitschule',
};

const PUBLIC_FIELDS = [
  'id',
  'name',
  'slug',
  'subTitle',
  'about',
  'website',
  'legalStatus',
  'enabled',
  'address',
  'zip',
  'city',
  'latitude',
  'longitude',
  'regionId',
];

const PUBLIC_RELATIONS = [
  'region',
  'tags',
  'affiliations',
  'contacts',
  'viewerCan',
];

const SENSITIVE_FIELDS = [
  'createdAt',
  'modifiedAt',
  'partner',
  'createdByMigration',
  'postOfficeBox',
  'members',
];

const publicData = {
  __typename: 'Organization',
  id: 'org-1',
  name: 'Dampfzentrale',
  slug: 'dampfzentrale',
  subTitle: 'Tanz und Musik',
  about: 'Kulturzentrum an der Aare',
  website: 'https://dampfzentrale.ch',
  legalStatus: 'association',
  enabled: true,
  address: 'Marzilistrasse 47',
  zip: '3005',
  city: 'Bern',
  latitude: 46.944,
  longitude: 7.446,
  regionId: 'region-1',
};

const sensitiveData = {
  ...publicData,
  __typename: 'SensitiveDataOrganization',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  partner: true,
  createdByMigration: true,
  postOfficeBox: 'Postfach 165',
  members: [{ userId: 'user-2' }],
};

const ORGANIZATION_FIELDS = `
  fragment OrganizationFields on BaseOrganization {
    __typename
    ${PUBLIC_FIELDS.join(' ')}
    ... on SensitiveDataOrganization {
      createdAt
      modifiedAt
      partner
      createdByMigration
      postOfficeBox
      members { userId }
    }
  }
`;

const member = {
  userId: 'user-2',
  organizationId: 'org-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
};

const MUTATIONS = {
  createOrganization: [CanCreateOrganization],
  updateOrganization: [CanUpdateOrganization],
  deleteOrganization: [CanDeleteOrganization],
  addOrganizationMember: [CanUpdateOtherOrganizations],
  removeOrganizationMember: [CanUpdateOtherOrganizations],
} as const;

const mutationNames = Object.keys(MUTATIONS) as (keyof typeof MUTATIONS)[];

const handler = (name: string) => (OrganizationResolver.prototype as any)[name];

describe('OrganizationResolver authorisation wiring', () => {
  it.each(['organization', 'organizations'])('%s is public', name => {
    expect(Reflect.getMetadata('public', handler(name))).toBe(true);
  });

  it.each(mutationNames)('%s needs its permission', name => {
    expect(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler(name))
    ).toEqual(MUTATIONS[name]);
    expect(Reflect.getMetadata(ONE_OF_METADATA_KEY, handler(name))).toContain(
      PermissionsGuard
    );
    expect(Reflect.getMetadata('public', handler(name))).toBeFalsy();
  });

  it('wires every operation the resolver exposes, with none forgotten', () => {
    const own = Object.getOwnPropertyNames(
      OrganizationResolver.prototype
    ).filter(
      name => name !== 'constructor' && typeof handler(name) === 'function'
    );

    expect(own.sort()).toEqual(
      ['organization', 'organizations', ...mutationNames].sort()
    );
  });

  it('resolves members on the sensitive type only', () => {
    expect(
      Object.getOwnPropertyNames(
        SensitiveDataOrganizationResolver.prototype
      ).filter(name => name !== 'constructor')
    ).toEqual(['members']);
  });
});

const createApp = async (
  session: () => AuthSession | undefined,
  mocks: {
    service: Record<string, ReturnType<typeof vi.fn>>;
    members: { load: ReturnType<typeof vi.fn> };
    users: { load: ReturnType<typeof vi.fn> };
    organizations: { load: ReturnType<typeof vi.fn> };
  },
  withGuards = false
) => {
  const module = await Test.createTestingModule({
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        path: '/',
        cache: 'bounded',
        context: ({ req }: { req: { user?: unknown } }) => {
          req.user = session();
          return { req };
        },
      }),
    ],
    providers: [
      OrganizationResolver,
      SensitiveDataOrganizationResolver,
      OrganizationMemberResolver,
      { provide: OrganizationService, useValue: mocks.service },
      { provide: OrganizationMembersDataloader, useValue: mocks.members },
      { provide: OrganizationDataloaderService, useValue: mocks.organizations },
      { provide: UserDataloaderService, useValue: mocks.users },
      ...(withGuards ?
        [
          { provide: APP_GUARD, useClass: OneOfGuard },
          PermissionsGuard,
          PublicGuard,
        ]
      : []),
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return app;
};

const mocks = () => ({
  service: {
    getOrganization: vi.fn().mockResolvedValue(organization),
    getOrganizations: vi.fn().mockResolvedValue({
      nodes: [organization],
      totalCount: 1,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: 'org-1',
        endCursor: 'org-1',
      },
    }),
    createOrganization: vi.fn().mockResolvedValue(organization),
    updateOrganization: vi.fn().mockResolvedValue(organization),
    deleteOrganization: vi.fn().mockResolvedValue(organization),
    addOrganizationMember: vi.fn().mockResolvedValue(member),
    removeOrganizationMember: vi.fn().mockResolvedValue(member),
  },
  members: { load: vi.fn().mockResolvedValue([member]) },
  users: { load: vi.fn().mockResolvedValue({ id: 'user-2', name: 'Ada' }) },
  organizations: { load: vi.fn().mockResolvedValue(organization) },
});

const gql = (app: INestApplication, query: string, variables = {}) =>
  request(app.getHttpServer()).post('/').send({ query, variables });

describe('OrganizationResolver', () => {
  let app: INestApplication;
  let session: AuthSession | undefined;
  let mock: ReturnType<typeof mocks>;

  beforeEach(async () => {
    session = undefined;
    mock = mocks();
    app = await createApp(() => session, mock);
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists organisations with the five list arguments and the session', async () => {
    session = user(['org-1']);

    const res = await gql(
      app,
      `query {
        organizations(filter: { mine: true }, sort: CreatedAt, order: Descending, take: 5, skip: 1, cursorId: "c") {
          nodes { id name }
          totalCount
        }
      }`
    );

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.organizations.nodes).toEqual([
      { id: 'org-1', name: 'Dampfzentrale' },
    ]);
    expect(mock.service.getOrganizations).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ mine: true }),
        sort: 'CreatedAt',
        order: 'Descending',
        take: 5,
        skip: 1,
        cursorId: 'c',
      }),
      session
    );
  });

  it('defaults the list to ten by name, ascending', async () => {
    await gql(app, `query { organizations { totalCount } }`);

    expect(mock.service.getOrganizations).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'Name',
        order: 'Ascending',
        take: 10,
        skip: 0,
      }),
      undefined
    );
  });

  it('finds an organisation by id or slug', async () => {
    await gql(app, `query { organization(id: "org-1") { id } }`);
    await gql(app, `query { organization(slug: "dampfzentrale") { id } }`);

    expect(mock.service.getOrganization).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'org-1' }),
      undefined
    );
    expect(mock.service.getOrganization).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ slug: 'dampfzentrale' }),
      undefined
    );
  });

  it('passes the session on to every write', async () => {
    session = user(['org-1'], CanUpdateOtherOrganizations.id);

    await gql(
      app,
      `mutation { createOrganization(name: "A", zip: "3011") { id } }`
    );
    await gql(
      app,
      `mutation { updateOrganization(id: "org-1", name: "B") { id } }`
    );
    await gql(app, `mutation { deleteOrganization(id: "org-1") { id } }`);

    expect(mock.service.createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'A', zip: '3011' }),
      session
    );
    expect(mock.service.updateOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'org-1', name: 'B' }),
      session
    );
    expect(mock.service.deleteOrganization).toHaveBeenCalledWith(
      'org-1',
      session
    );
  });

  it('adds and removes members', async () => {
    const res = await gql(
      app,
      `mutation {
        addOrganizationMember(organizationId: "org-1", userId: "user-2") {
          userId
          user { id }
          organization { id name }
        }
      }`
    );
    await gql(
      app,
      `mutation { removeOrganizationMember(organizationId: "org-1", userId: "user-2") { userId } }`
    );

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.addOrganizationMember).toEqual({
      userId: 'user-2',
      user: { id: 'user-2' },
      organization: { id: 'org-1', name: 'Dampfzentrale' },
    });
    expect(mock.users.load).toHaveBeenCalledWith('user-2');
    expect(mock.organizations.load).toHaveBeenCalledWith('org-1');
    expect(mock.service.removeOrganizationMember).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', userId: 'user-2' })
    );
  });

  describe('public and sensitive data', () => {
    const fieldsOf = async (name: string) =>
      (
        await gql(
          app,
          `query { __type(name: "${name}") { kind fields { name } interfaces { name } } }`
        )
      ).body.data.__type;

    const organizationAs = async (caller: AuthSession | undefined) => {
      session = caller;

      const res = await gql(
        app,
        `query { organization(id: "org-1") { ...OrganizationFields } } ${ORGANIZATION_FIELDS}`
      );

      expect(res.body.errors).toBeUndefined();

      return res.body.data.organization;
    };

    it('splits the public fields from the sensitive ones in the schema', async () => {
      const base = await fieldsOf('BaseOrganization');
      const open = await fieldsOf('Organization');
      const sensitive = await fieldsOf('SensitiveDataOrganization');

      expect(base.kind).toBe('INTERFACE');
      expect(base.fields.map((f: { name: string }) => f.name).sort()).toEqual(
        [...PUBLIC_FIELDS, ...PUBLIC_RELATIONS].sort()
      );
      expect(open.fields.map((f: { name: string }) => f.name).sort()).toEqual(
        [...PUBLIC_FIELDS, ...PUBLIC_RELATIONS].sort()
      );
      expect(open.interfaces).toEqual([{ name: 'BaseOrganization' }]);
      expect(
        sensitive.fields.map((f: { name: string }) => f.name).sort()
      ).toEqual(
        [...PUBLIC_FIELDS, ...PUBLIC_RELATIONS, ...SENSITIVE_FIELDS].sort()
      );
      expect(sensitive.interfaces).toEqual([{ name: 'BaseOrganization' }]);
    });

    it('does not let anyone ask the public type for a sensitive field', async () => {
      const res = await gql(
        app,
        `query { organization(id: "org-1") { partner } }`
      );

      expect(res.body.errors?.[0]?.message).toContain('partner');
      expect(mock.service.getOrganization).not.toHaveBeenCalled();
    });

    it('gives anonymous callers the public data only', async () => {
      expect(await organizationAs(undefined)).toEqual(publicData);
      expect(mock.members.load).not.toHaveBeenCalled();
    });

    it('gives users of other organisations the public data only', async () => {
      expect(await organizationAs(user(['org-2']))).toEqual(publicData);
      expect(
        await organizationAs(
          user([], CanUpdateOrganization.id, CanGetOtherOrganizationEvents.id)
        )
      ).toEqual(publicData);
      expect(mock.members.load).not.toHaveBeenCalled();
    });

    it('gives members the sensitive data of their organisation', async () => {
      expect(await organizationAs(user(['org-1']))).toEqual(sensitiveData);
      expect(mock.members.load).toHaveBeenCalledWith('org-1');
    });

    it('gives whoever may read or update any organisation the sensitive data', async () => {
      expect(
        await organizationAs(user([], CanGetOtherOrganizations.id))
      ).toEqual(sensitiveData);
      expect(
        await organizationAs(user([], CanUpdateOtherOrganizations.id))
      ).toEqual(sensitiveData);
    });

    it('lets api keys follow their permissions', async () => {
      expect(await organizationAs(apiKey(CanGetOtherOrganizations.id))).toEqual(
        sensitiveData
      );
      expect(
        await organizationAs(apiKey(CanUpdateOtherOrganizations.id))
      ).toEqual(sensitiveData);
      expect(await organizationAs(apiKey(CanUpdateOrganization.id))).toEqual(
        publicData
      );
      expect(await organizationAs(apiKey())).toEqual(publicData);
    });

    it('decides per organisation in a list', async () => {
      session = user(['org-2']);
      mock.service.getOrganizations.mockResolvedValue({
        nodes: [organization, otherOrganization],
        totalCount: 2,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: 'org-1',
          endCursor: 'org-2',
        },
      });

      const res = await gql(
        app,
        `query { organizations { nodes { ...OrganizationFields } } } ${ORGANIZATION_FIELDS}`
      );

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.organizations.nodes).toEqual([
        publicData,
        {
          ...sensitiveData,
          id: 'org-2',
          name: 'Reitschule',
          slug: 'reitschule',
        },
      ]);
      expect(mock.members.load).toHaveBeenCalledTimes(1);
      expect(mock.members.load).toHaveBeenCalledWith('org-2');
    });

    it('decides per caller on the organisation of a membership', async () => {
      const organizationOfMember = async () =>
        (
          await gql(
            app,
            `mutation {
              addOrganizationMember(organizationId: "org-1", userId: "user-2") {
                organization { __typename }
              }
            }`
          )
        ).body.data.addOrganizationMember.organization.__typename;

      expect(await organizationOfMember()).toBe('Organization');

      session = user([], CanUpdateOtherOrganizations.id);
      expect(await organizationOfMember()).toBe('SensitiveDataOrganization');
    });

    it.each([
      [
        'createOrganization',
        `mutation { createOrganization(name: "A") { ...OrganizationFields } }`,
      ],
      [
        'updateOrganization',
        `mutation { updateOrganization(id: "org-1", name: "B") { ...OrganizationFields } }`,
      ],
      [
        'deleteOrganization',
        `mutation { deleteOrganization(id: "org-1") { ...OrganizationFields } }`,
      ],
    ])(
      '%s returns the sensitive data to whoever was allowed to write',
      async (name, mutation) => {
        session = user([], CanUpdateOtherOrganizations.id);

        const res = await gql(app, `${mutation} ${ORGANIZATION_FIELDS}`);

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data[name]).toEqual(sensitiveData);
      }
    );
  });
});

describe('OrganizationResolver behind the real guards', () => {
  let app: INestApplication;
  let session: AuthSession | undefined;
  let mock: ReturnType<typeof mocks>;

  beforeEach(async () => {
    session = undefined;
    mock = mocks();
    app = await createApp(() => session, mock, true);
  });

  afterEach(async () => {
    await app.close();
  });

  it.each<[keyof ReturnType<typeof mocks>['service'], string]>([
    ['createOrganization', `mutation { createOrganization(name: "A") { id } }`],
    [
      'updateOrganization',
      `mutation { updateOrganization(id: "org-1", name: "B") { id } }`,
    ],
    [
      'deleteOrganization',
      `mutation { deleteOrganization(id: "org-1") { id } }`,
    ],
    [
      'addOrganizationMember',
      `mutation { addOrganizationMember(organizationId: "org-1", userId: "u") { userId } }`,
    ],
    [
      'removeOrganizationMember',
      `mutation { removeOrganizationMember(organizationId: "org-1", userId: "u") { userId } }`,
    ],
  ])('refuses %s without the permission', async (name, query) => {
    session = user(['org-1']);

    const res = await gql(app, query);

    expect(res.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(mock.service[name]).not.toHaveBeenCalled();
  });

  it('lets anonymous callers list organisations', async () => {
    const res = await gql(app, `query { organizations { totalCount } }`);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.organizations.totalCount).toBe(1);
  });

  it('gives anonymous callers the public data and members the sensitive data', async () => {
    const read = async () =>
      (
        await gql(
          app,
          `query { organization(id: "org-1") { ...OrganizationFields } } ${ORGANIZATION_FIELDS}`
        )
      ).body;

    expect(await read()).toEqual({ data: { organization: publicData } });

    session = user(['org-1']);
    expect(await read()).toEqual({ data: { organization: sensitiveData } });
  });

  it('lets a member with the permission update', async () => {
    session = user(['org-1'], CanUpdateOrganization.id);

    const res = await gql(
      app,
      `mutation { updateOrganization(id: "org-1", name: "B") { id } }`
    );

    expect(res.body.errors).toBeUndefined();
    expect(mock.service.updateOrganization).toHaveBeenCalled();
  });
});
