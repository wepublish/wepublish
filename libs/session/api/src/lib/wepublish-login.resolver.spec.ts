import { ApolloDriverConfig } from '@nestjs/apollo';
import { ForbiddenException, INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { NodeAdapter } from '@nestjs/platform-node';
import { Test, TestingModule } from '@nestjs/testing';
import { NodeApolloDriver } from '@wepublish/utils/api';
import request from 'supertest';
import { WepublishLoginResolver } from './wepublish-login.resolver';
import { WepublishLoginService } from './wepublish-login.service';

const WepublishLogin = `
  query WepublishLogin {
    wepublishLogin {
      authorizationUrl
      clientId
      redirectUri
      scope
    }
  }
`;

const CreateSessionWithWepublishLogin = `
  mutation CreateSessionWithWepublishLogin($code: String!, $codeVerifier: String!) {
    createSessionWithWepublishLogin(code: $code, codeVerifier: $codeVerifier) {
      token
      user {
        email
      }
    }
  }
`;

const client = {
  authorizationUrl: 'https://auth.wepublish.cloud/oauth/v2/authorize',
  clientId: '399257510109839364',
  redirectUri: 'https://editor-bajour.wepublish.cloud/login/wepublish',
  scope: 'openid email profile urn:zitadel:iam:org:project:roles',
};

describe('WepublishLoginResolver', () => {
  let app: INestApplication;
  let service: {
    client: ReturnType<typeof vi.fn>;
    createSession: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = { client: vi.fn(), createSession: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: NodeApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        WepublishLoginResolver,
        { provide: WepublishLoginService, useValue: service },
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

  test('tells the editor where to send a We.Publish admin', async () => {
    service.client.mockReturnValue(client);

    const res = await send(WepublishLogin);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.wepublishLogin).toEqual(client);
  });

  test('has nothing to offer where the login is off', async () => {
    service.client.mockReturnValue(null);

    const res = await send(WepublishLogin);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.wepublishLogin).toBeNull();
  });

  test('redeems the code with its verifier for a session', async () => {
    service.createSession.mockResolvedValue({
      token: 'token-1',
      createdAt: new Date(),
      expiresAt: new Date(),
      totpEnabled: false,
      impersonated: false,
      user: { email: 'jane@wepublish.ch' },
    });

    const res = await send(CreateSessionWithWepublishLogin, {
      code: 'code-1',
      codeVerifier: 'verifier-1',
    });

    expect(res.body.errors).toBeUndefined();
    expect(service.createSession).toHaveBeenCalledWith('code-1', 'verifier-1');
    expect(res.body.data.createSessionWithWepublishLogin).toEqual({
      token: 'token-1',
      user: { email: 'jane@wepublish.ch' },
    });
  });

  test('reports a refusal as forbidden', async () => {
    service.createSession.mockRejectedValue(
      new ForbiddenException('We.Publish account lacks the role')
    );

    const res = await send(CreateSessionWithWepublishLogin, {
      code: 'code-1',
      codeVerifier: 'verifier-1',
    });

    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
  });
});
