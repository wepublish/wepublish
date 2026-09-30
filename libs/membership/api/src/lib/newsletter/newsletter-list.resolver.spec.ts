import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { NewsletterListLockedDisplay } from '@prisma/client';
import { createMock, PartialMocked } from '@wepublish/testing';
import { NewsletterListResolver } from './newsletter-list.resolver';
import { NewsletterListService } from './newsletter-list.service';
import { NewsletterListMemberPlansDataloader } from './newsletter-list-member-plans.dataloader';

const mockList = {
  id: 'list-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Members',
  slug: 'members',
  description: 'Only for members',
  active: true,
  requiresSubscription: true,
  anyMemberPlan: false,
  autoSubscribe: true,
  lockedDisplay: NewsletterListLockedDisplay.teaser,
  lockedText: 'Become a member',
  lockedLinkUrl: null,
};

const listFields = `
  id
  name
  slug
  description
  active
  requiresSubscription
  anyMemberPlan
  autoSubscribe
  lockedDisplay
  lockedText
  lockedLinkUrl
  memberPlans {
    id
    name
  }
`;

describe('NewsletterListResolver', () => {
  let app: INestApplication;
  let lists: PartialMocked<NewsletterListService>;
  let memberPlans: { load: jest.Mock };

  beforeAll(async () => {
    lists = createMock(NewsletterListService);
    memberPlans = { load: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        NewsletterListResolver,
        { provide: NewsletterListService, useValue: lists },
        { provide: NewsletterListMemberPlansDataloader, useValue: memberPlans },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    memberPlans.load.mockResolvedValue([
      { id: 'plan-a', name: 'Plan A', slug: 'plan-a' },
    ]);
  });

  test('newsletterLists query resolves the member plans', async () => {
    lists.list?.mockResolvedValue([mockList]);

    await request(app.getHttpServer())
      .post('')
      .send({ query: `query { newsletterLists { ${listFields} } }` })
      .expect(200)
      .expect(res => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.newsletterLists).toEqual([
          {
            id: 'list-1',
            name: 'Members',
            slug: 'members',
            description: 'Only for members',
            active: true,
            requiresSubscription: true,
            anyMemberPlan: false,
            autoSubscribe: true,
            lockedDisplay: 'teaser',
            lockedText: 'Become a member',
            lockedLinkUrl: null,
            memberPlans: [{ id: 'plan-a', name: 'Plan A' }],
          },
        ]);
      });

    expect(memberPlans.load).toHaveBeenCalledWith('list-1');
  });

  test('createNewsletterList mutation', async () => {
    lists.create?.mockResolvedValue(mockList);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `
          mutation {
            createNewsletterList(
              name: "Members"
              slug: "members"
              requiresSubscription: true
              lockedDisplay: teaser
              memberPlanIds: ["plan-a"]
            ) { id }
          }
        `,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.createNewsletterList).toEqual({ id: 'list-1' });
      });

    expect(lists.create).toHaveBeenCalledWith({
      name: 'Members',
      slug: 'members',
      requiresSubscription: true,
      lockedDisplay: NewsletterListLockedDisplay.teaser,
      memberPlanIds: ['plan-a'],
    });
  });

  test('updateNewsletterList mutation', async () => {
    lists.update?.mockResolvedValue(mockList);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `
          mutation {
            updateNewsletterList(id: "list-1", name: "Renamed", lockedText: null) { id }
          }
        `,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.errors).toBeUndefined();
      });

    expect(lists.update).toHaveBeenCalledWith({
      id: 'list-1',
      name: 'Renamed',
      lockedText: null,
    });
  });

  test('deleteNewsletterList mutation', async () => {
    lists.delete?.mockResolvedValue(mockList);

    await request(app.getHttpServer())
      .post('')
      .send({ query: `mutation { deleteNewsletterList(id: "list-1") { id } }` })
      .expect(200)
      .expect(res => {
        expect(res.body.data.deleteNewsletterList).toEqual({ id: 'list-1' });
      });
  });

  test('backfillNewsletterList mutation returns the number of added users', async () => {
    lists.backfill?.mockResolvedValue(42);

    await request(app.getHttpServer())
      .post('')
      .send({ query: `mutation { backfillNewsletterList(id: "list-1") }` })
      .expect(200)
      .expect(res => {
        expect(res.body.data.backfillNewsletterList).toBe(42);
      });

    expect(lists.backfill).toHaveBeenCalledWith('list-1');
  });
});
