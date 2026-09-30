import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { NewsletterSubscriberSource } from '@prisma/client';
import { createMock, PartialMocked } from '@wepublish/testing';
import { UserDataloaderService } from '@wepublish/user/api';
import { NewsletterSubscriberAdminResolver } from './newsletter-subscriber-admin.resolver';
import { NewsletterSubscriberAdminService } from './newsletter-subscriber-admin.service';
import { NewsletterSubscriberStatus } from './newsletter-subscriber.model';

const subscriber = {
  id: 'row-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  userId: 'user-1',
  listId: 'list-1',
  source: NewsletterSubscriberSource.self,
  subscribedAt: new Date('2026-01-01T00:00:00.000Z'),
  confirmedAt: new Date('2026-01-01T00:00:00.000Z'),
  unsubscribedAt: null,
  status: NewsletterSubscriberStatus.SUBSCRIBED,
  receiving: true,
};

const subscriberFields = `
  id
  source
  status
  receiving
  subscribedAt
  confirmedAt
  unsubscribedAt
  user {
    id
    email
  }
`;

describe('NewsletterSubscriberAdminResolver', () => {
  let app: INestApplication;
  let admin: PartialMocked<NewsletterSubscriberAdminService>;
  let users: { load: jest.Mock };

  beforeAll(async () => {
    admin = createMock(NewsletterSubscriberAdminService);
    users = { load: jest.fn() };

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
        NewsletterSubscriberAdminResolver,
        { provide: NewsletterSubscriberAdminService, useValue: admin },
        { provide: UserDataloaderService, useValue: users },
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
    users.load.mockResolvedValue({
      id: 'user-1',
      email: 'member@example.com',
      name: 'Member',
      active: true,
      roleIDs: [],
      properties: [],
      createdAt: new Date('2026-01-01'),
      modifiedAt: new Date('2026-01-01'),
    });
  });

  test('newsletterSubscribers returns a page of subscribers with their users', async () => {
    admin.listSubscribers?.mockResolvedValue({
      nodes: [subscriber],
      totalCount: 1,
      pageInfo: { hasPreviousPage: false, hasNextPage: false },
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `
          query {
            newsletterSubscribers(listId: "list-1", filter: { status: PENDING, q: "anna" }, take: 10, skip: 5) {
              nodes { ${subscriberFields} }
              totalCount
              pageInfo { hasNextPage }
            }
          }
        `,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.newsletterSubscribers).toEqual({
          nodes: [
            {
              id: 'row-1',
              source: 'self',
              status: 'SUBSCRIBED',
              receiving: true,
              subscribedAt: '2026-01-01T00:00:00.000Z',
              confirmedAt: '2026-01-01T00:00:00.000Z',
              unsubscribedAt: null,
              user: { id: 'user-1', email: 'member@example.com' },
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        });
      });

    expect(admin.listSubscribers).toHaveBeenCalledWith(
      'list-1',
      { status: NewsletterSubscriberStatus.PENDING, q: 'anna' },
      10,
      5
    );
    expect(users.load).toHaveBeenCalledWith('user-1');
  });

  test('newsletterSubscribers defaults to the first page', async () => {
    admin.listSubscribers?.mockResolvedValue({
      nodes: [],
      totalCount: 0,
      pageInfo: { hasPreviousPage: false, hasNextPage: false },
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `query { newsletterSubscribers(listId: "list-1") { totalCount } }`,
      })
      .expect(200);

    expect(admin.listSubscribers).toHaveBeenCalledWith('list-1', {}, 25, 0);
  });

  test('newsletterSubscriberCounts', async () => {
    admin.countSubscribers?.mockResolvedValue({
      subscribed: 5,
      pending: 2,
      unsubscribed: 1,
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `query { newsletterSubscriberCounts(listId: "list-1") { subscribed pending unsubscribed } }`,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.newsletterSubscriberCounts).toEqual({
          subscribed: 5,
          pending: 2,
          unsubscribed: 1,
        });
      });
  });

  test('newsletterSubscriber returns null for users without an entry', async () => {
    admin.getSubscriber?.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `query { newsletterSubscriber(listId: "list-1", userId: "user-1") { id } }`,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.newsletterSubscriber).toBeNull();
      });
  });

  test('addNewsletterSubscriber passes the force flag', async () => {
    admin.addByEditor?.mockResolvedValue(subscriber);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `mutation { addNewsletterSubscriber(listId: "list-1", userId: "user-1", force: true) { id } }`,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.addNewsletterSubscriber).toEqual({ id: 'row-1' });
      });

    expect(admin.addByEditor).toHaveBeenCalledWith('list-1', 'user-1', true);
  });

  test('addNewsletterSubscriber is not forced by default', async () => {
    admin.addByEditor?.mockResolvedValue(subscriber);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `mutation { addNewsletterSubscriber(listId: "list-1", userId: "user-1") { id } }`,
      })
      .expect(200);

    expect(admin.addByEditor).toHaveBeenCalledWith('list-1', 'user-1', false);
  });

  test('removeNewsletterSubscriber', async () => {
    admin.removeByEditor?.mockResolvedValue({
      ...subscriber,
      status: NewsletterSubscriberStatus.UNSUBSCRIBED,
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `mutation { removeNewsletterSubscriber(listId: "list-1", userId: "user-1") { status } }`,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.removeNewsletterSubscriber.status).toBe(
          'UNSUBSCRIBED'
        );
      });

    expect(admin.removeByEditor).toHaveBeenCalledWith('list-1', 'user-1');
  });
});
