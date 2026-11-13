import { ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { NodeAdapter } from '@nestjs/platform-node';
import { Test, TestingModule } from '@nestjs/testing';
import { NodeApolloDriver } from '@wepublish/utils/api';
import request from 'supertest';
import { ImpersonationResolver } from './impersonation.resolver';
import { ImpersonationService } from './impersonation.service';

const session = { type: 'user', id: 'session-1', user: { id: 'user-1' } };

describe('ImpersonationResolver', () => {
  let app: INestApplication;
  let service: {
    currentSession: ReturnType<typeof vi.fn>;
    impersonateInEditor: ReturnType<typeof vi.fn>;
    impersonateOnWebsite: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      currentSession: vi.fn(),
      impersonateInEditor: vi.fn(),
      impersonateOnWebsite: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: NodeApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: { req: { user: session } },
        }),
      ],
      providers: [
        ImpersonationResolver,
        { provide: ImpersonationService, useValue: service },
      ],
    }).compile();

    app = module.createNestApplication(new NodeAdapter());
    await app.listen(0, '127.0.0.1');
  });

  afterEach(async () => {
    await app.close();
  });

  const send = (query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/').send({ query, variables });

  test('tells the client about its session', async () => {
    service.currentSession.mockReturnValue({
      canImpersonate: true,
      impersonatedBy: null,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    const res = await send(
      '{ currentSession { canImpersonate impersonatedBy expiresAt } }'
    );

    expect(res.body.errors).toBeUndefined();
    expect(service.currentSession).toHaveBeenCalledWith(session);
    expect(res.body.data.currentSession).toEqual({
      canImpersonate: true,
      impersonatedBy: null,
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
  });

  test('impersonates in the editor', async () => {
    service.impersonateInEditor.mockResolvedValue({
      token: 'token-2',
      createdAt: new Date(),
      expiresAt: new Date(),
      totpEnabled: false,
      impersonated: true,
      user: { email: 'reader@example.com' },
    });

    const res = await send(
      `mutation ($userId: String!, $reason: String!) {
        impersonateUser(userId: $userId, reason: $reason) { token impersonated }
      }`,
      { userId: 'user-2', reason: 'Ticket 4711' }
    );

    expect(res.body.errors).toBeUndefined();
    expect(service.impersonateInEditor).toHaveBeenCalledWith(
      session,
      'user-2',
      'Ticket 4711'
    );
    expect(res.body.data.impersonateUser).toEqual({
      token: 'token-2',
      impersonated: true,
    });
  });

  test('hands out a grant for the website', async () => {
    service.impersonateOnWebsite.mockResolvedValue({
      token: 'grant-jwt',
      url: 'https://www.medium.ch',
    });

    const res = await send(
      `mutation ($userId: String!, $reason: String!) {
        createWebsiteImpersonation(userId: $userId, reason: $reason) { token url }
      }`,
      { userId: 'user-2', reason: 'Ticket 4711' }
    );

    expect(res.body.errors).toBeUndefined();
    expect(service.impersonateOnWebsite).toHaveBeenCalledWith(
      session,
      'user-2',
      'Ticket 4711'
    );
    expect(res.body.data.createWebsiteImpersonation).toEqual({
      token: 'grant-jwt',
      url: 'https://www.medium.ch',
    });
  });
});
