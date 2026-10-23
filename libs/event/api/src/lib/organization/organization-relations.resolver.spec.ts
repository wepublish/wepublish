import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import {
  CanDeleteOrganization,
  CanGetOtherOrganizations,
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import request from 'supertest';
import { OrganizationMembersDataloader } from './organization-members.dataloader';
import {
  OrganizationAffiliationsDataloader,
  OrganizationContactsDataloader,
  OrganizationTagsDataloader,
} from './organization-relations.dataloader';
import { OrganizationRelationsResolver } from './organization-relations.resolver';
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

const sessions: Record<string, AuthSession | undefined> = {
  editor: user(['org-1'], CanUpdateOrganization.id),
  memberWithoutPermissions: user(['org-1']),
  reader: user([], CanGetOtherOrganizations.id),
  crossOrg: user(
    [],
    CanUpdateOrganization.id,
    CanDeleteOrganization.id,
    CanUpdateOtherOrganizations.id
  ),
  key: organizationKey('org-1', CanUpdateOrganization.id),
};

const organization = {
  id: 'org-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Dampfzentrale',
  slug: 'dampfzentrale',
  enabled: true,
  partner: false,
  createdByMigration: false,
  regionId: null,
};

describe('OrganizationRelationsResolver', () => {
  let app: INestApplication;
  const service = { getOrganization: vi.fn() };
  const tags = { load: vi.fn() };
  const affiliations = { load: vi.fn() };
  const contacts = { load: vi.fn() };

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
        OrganizationResolver,
        SensitiveDataOrganizationResolver,
        OrganizationRelationsResolver,
        { provide: OrganizationService, useValue: service },
        { provide: OrganizationMembersDataloader, useValue: { load: vi.fn() } },
        { provide: OrganizationTagsDataloader, useValue: tags },
        { provide: OrganizationAffiliationsDataloader, useValue: affiliations },
        { provide: OrganizationContactsDataloader, useValue: contacts },
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
    service.getOrganization.mockResolvedValue(organization);
    tags.load.mockResolvedValue([
      { id: 'tag-1', tag: 'Jazz', type: 'Event' },
      { id: 'tag-2', tag: 'Tanz', type: 'Event' },
    ]);
    affiliations.load.mockResolvedValue([
      { id: 'aff-1', name: 'BeKult', slug: 'bekult' },
    ]);
    contacts.load.mockResolvedValue([
      {
        id: 'contact-1',
        organizationId: 'org-1',
        label: 'Kasse',
        email: 'kasse@dampfzentrale.ch',
        phone: null,
        legacyId: BigInt(3),
      },
    ]);
  });

  const send = (query: string, session?: string) =>
    request(app.getHttpServer())
      .post('/')
      .set(session ? { 'x-session': session } : {})
      .send({ query });

  const relationsQuery = `
    query {
      organization(id: "org-1") {
        __typename
        tags { id tag }
        affiliations { id name }
        contacts { id label email phone }
      }
    }
  `;

  it('resolves tags, affiliations and contacts for anonymous callers, through the dataloaders', async () => {
    const res = await send(relationsQuery).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.organization).toEqual({
      __typename: 'Organization',
      tags: [
        { id: 'tag-1', tag: 'Jazz' },
        { id: 'tag-2', tag: 'Tanz' },
      ],
      affiliations: [{ id: 'aff-1', name: 'BeKult' }],
      contacts: [
        {
          id: 'contact-1',
          label: 'Kasse',
          email: 'kasse@dampfzentrale.ch',
          phone: null,
        },
      ],
    });
    expect(tags.load).toHaveBeenCalledWith('org-1');
    expect(affiliations.load).toHaveBeenCalledWith('org-1');
    expect(contacts.load).toHaveBeenCalledWith('org-1');
  });

  it('resolves the same relations on the sensitive type for members', async () => {
    const res = await send(relationsQuery, 'editor').expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.organization).toMatchObject({
      __typename: 'SensitiveDataOrganization',
      tags: [{ id: 'tag-1' }, { id: 'tag-2' }],
      affiliations: [{ id: 'aff-1' }],
      contacts: [{ id: 'contact-1' }],
    });
  });

  const viewerCanQuery = `
    query {
      organization(id: "org-1") {
        viewerCan { update updatePrivileged delete manageMembers }
      }
    }
  `;

  const none = {
    update: false,
    updatePrivileged: false,
    delete: false,
    manageMembers: false,
  };

  it.each<[string, string | undefined, typeof none]>([
    ['an anonymous caller', undefined, none],
    [
      'a member with CAN_UPDATE_ORGANIZATION',
      'editor',
      { ...none, update: true },
    ],
    ['a member without it', 'memberWithoutPermissions', none],
    ['a reader of every organisation', 'reader', none],
    [
      'a cross-organisation editor',
      'crossOrg',
      {
        update: true,
        updatePrivileged: true,
        delete: true,
        manageMembers: true,
      },
    ],
    ['an api key of the organisation', 'key', { ...none, update: true }],
  ])('tells %s what it may do', async (_, session, expected) => {
    const res = await send(viewerCanQuery, session).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.organization.viewerCan).toEqual(expected);
  });
});
