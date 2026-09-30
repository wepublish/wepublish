import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { createMock, PartialMocked } from '@wepublish/testing';
import { NewsletterMemberResolver } from './newsletter-member.resolver';
import { NewsletterSubscriberService } from './newsletter-subscriber.service';
import { NewsletterListUserStatus } from './my-newsletter-list.model';

const myList = {
  id: 'list-1',
  name: 'Morning Briefing',
  slug: 'morning-briefing',
  description: 'Every morning',
  lockedText: null,
  lockedLinkUrl: null,
  status: NewsletterListUserStatus.SUBSCRIBED,
};

const myListFields = `
  id
  name
  slug
  description
  lockedText
  lockedLinkUrl
  status
`;

describe('NewsletterMemberResolver', () => {
  let app: INestApplication;
  let subscribers: PartialMocked<NewsletterSubscriberService>;

  beforeAll(async () => {
    subscribers = createMock(NewsletterSubscriberService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: () => ({ req: { user: { user: { id: 'user-1' } } } }),
        }),
      ],
      providers: [
        NewsletterMemberResolver,
        { provide: NewsletterSubscriberService, useValue: subscribers },
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
  });

  test('myNewsletterLists returns the lists of the current user', async () => {
    subscribers.getMyLists?.mockResolvedValue([myList]);

    await request(app.getHttpServer())
      .post('')
      .send({ query: `query { myNewsletterLists { ${myListFields} } }` })
      .expect(200)
      .expect(res => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.myNewsletterLists).toEqual([myList]);
      });

    expect(subscribers.getMyLists).toHaveBeenCalledWith('user-1');
  });

  test('subscribeToNewsletterList subscribes the current user', async () => {
    subscribers.subscribe?.mockResolvedValue({
      ...myList,
      status: NewsletterListUserStatus.PENDING,
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `mutation { subscribeToNewsletterList(listId: "list-1") { id status } }`,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.subscribeToNewsletterList).toEqual({
          id: 'list-1',
          status: 'PENDING',
        });
      });

    expect(subscribers.subscribe).toHaveBeenCalledWith('user-1', 'list-1');
  });

  test('unsubscribeFromNewsletterList unsubscribes the current user', async () => {
    subscribers.unsubscribe?.mockResolvedValue({
      ...myList,
      status: NewsletterListUserStatus.NOT_SUBSCRIBED,
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `mutation { unsubscribeFromNewsletterList(listId: "list-1") { id status } }`,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.unsubscribeFromNewsletterList.status).toBe(
          'NOT_SUBSCRIBED'
        );
      });

    expect(subscribers.unsubscribe).toHaveBeenCalledWith('user-1', 'list-1');
  });

  test('confirmNewsletterSubscription passes the token on', async () => {
    subscribers.confirm?.mockResolvedValue([myList]);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `mutation { confirmNewsletterSubscription(token: "confirm-token") { id status } }`,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.confirmNewsletterSubscription).toEqual([
          { id: 'list-1', status: 'SUBSCRIBED' },
        ]);
      });

    expect(subscribers.confirm).toHaveBeenCalledWith('confirm-token');
  });
});
