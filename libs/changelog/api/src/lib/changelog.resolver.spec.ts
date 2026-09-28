import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ChangelogResolver } from './changelog.resolver';
import { ChangelogService } from './changelog.service';

const changelogEntriesQuery = `
  query changelogEntries($take: Int, $skip: Int, $filter: ChangelogEntryFilter) {
    changelogEntries(take: $take, skip: $skip, filter: $filter) {
      nodes {
        id
        name
        releasedAt
        title
        lead
        description
        actionRequired
        confirmedAt
        confirmedByUserId
      }
      totalCount
      pageInfo {
        hasPreviousPage
        hasNextPage
      }
    }
  }
`;

const confirmChangelogEntryMutation = `
  mutation confirmChangelogEntry($id: String!) {
    confirmChangelogEntry(id: $id) {
      id
      confirmedAt
      confirmedByUserId
    }
  }
`;

const mockEntry = {
  id: 'entry-1',
  createdAt: new Date('2026-08-25T12:00:00Z'),
  modifiedAt: new Date('2026-08-25T12:00:00Z'),
  name: '20260825120000_user_changelog',
  releasedAt: new Date('2026-08-25T12:00:00Z'),
  title: 'A title',
  lead: 'A lead',
  description: 'A description',
  actionRequired: true,
  confirmedAt: null,
  confirmedByUserId: null,
};

const mockSession = {
  user: {
    id: 'user-1',
  },
};

describe('ChangelogResolver', () => {
  let app: INestApplication;

  const changelogService = {
    getChangelogEntries: jest.fn(),
    confirmChangelogEntry: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: ({ req }: { req: { user?: unknown } }) => {
            req.user = mockSession;
            return { req };
          },
        }),
      ],
      providers: [
        ChangelogResolver,
        {
          provide: ChangelogService,
          useValue: changelogService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  test('changelogEntries query', async () => {
    changelogService.getChangelogEntries.mockResolvedValue({
      nodes: [mockEntry],
      totalCount: 1,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: 'entry-1',
        endCursor: 'entry-1',
      },
    });

    const response = await request(app.getHttpServer())
      .post('')
      .send({
        query: changelogEntriesQuery,
        variables: {
          take: 5,
          filter: { actionRequired: true, confirmed: false },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.changelogEntries).toEqual({
      nodes: [
        {
          id: 'entry-1',
          name: '20260825120000_user_changelog',
          releasedAt: '2026-08-25T12:00:00.000Z',
          title: 'A title',
          lead: 'A lead',
          description: 'A description',
          actionRequired: true,
          confirmedAt: null,
          confirmedByUserId: null,
        },
      ],
      totalCount: 1,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
    expect(changelogService.getChangelogEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 0,
        filter: expect.objectContaining({
          actionRequired: true,
          confirmed: false,
        }),
      })
    );
  });

  test('confirmChangelogEntry mutation passes the current user', async () => {
    const confirmedAt = new Date('2026-08-25T14:00:00Z');
    changelogService.confirmChangelogEntry.mockResolvedValue({
      ...mockEntry,
      confirmedAt,
      confirmedByUserId: 'user-1',
    });

    const response = await request(app.getHttpServer())
      .post('')
      .send({
        query: confirmChangelogEntryMutation,
        variables: {
          id: 'entry-1',
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.confirmChangelogEntry).toEqual({
      id: 'entry-1',
      confirmedAt: confirmedAt.toISOString(),
      confirmedByUserId: 'user-1',
    });
    expect(changelogService.confirmChangelogEntry).toHaveBeenCalledWith(
      'entry-1',
      'user-1',
      undefined
    );
  });
});
