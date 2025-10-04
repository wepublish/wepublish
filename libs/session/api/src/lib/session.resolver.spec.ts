import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { createMock, PartialMocked } from '@wepublish/testing';
import { SessionResolver } from './session.resolver';
import { SessionService } from './session.service';

@Resolver()
export class ObligatoryQueryResolver {
  @Query(() => Boolean, {
    description: `This is test query used when testing mutation-only resolver.`,
  })
  async testQuery() {
    return true;
  }
}

export const CreateSession = `
  mutation CreateSession($email: String!, $password: String!) {
    createSession(email: $email, password: $password) {
      user {
        email
      }
      token
    }
  }
`;

export const CreateSessionWithJwt = `
  mutation CreateSessionWithJWT($jwt: String!) {
    createSessionWithJWT(jwt: $jwt) {
      user {
        email
      }
      token
    }
  }
`;

const mockUser = {
  id: 'userId',
  name: 'name',
  firstName: 'firstName',
  birthday: null,
  email: 'dev@wepublish.ch',
  active: true,
  flair: 'flair',
  userImageID: 'userImageId',
  roleIDs: [],
};

const mockUserSession = {
  type: 'user',
  id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd',
  token: 'some-token',
  user: mockUser,
};

describe('SessionResolver', () => {
  let app: INestApplication;

  let sessionService: PartialMocked<SessionService>;

  beforeEach(async () => {
    sessionService = createMock(SessionService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: {
            req: {
              user: mockUserSession,
            },
          },
        }),
      ],
      providers: [
        SessionResolver,
        ObligatoryQueryResolver,
        {
          provide: SessionService,
          useValue: sessionService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('can be created via mail and password', async () => {
    sessionService.createSessionWithEmailAndPassword.mockResolvedValue(
      mockUserSession as any
    );
    const res = await request(app.getHttpServer())
      .post('/')
      .send({
        query: CreateSession,
        variables: {
          email: 'dev@wepublish.ch',
          password: '123',
        },
      });
    const session = res.body.data?.createSession;
    expect(res.body.errors).toBeUndefined();
    expect(
      sessionService.createSessionWithEmailAndPassword.mock.calls
    ).toMatchSnapshot();
    expect(session.user.email).toBe('dev@wepublish.ch');
    expect(session.token).toBeDefined();
  });

  test('can be create via JWT', async () => {
    sessionService.createSessionWithJWT.mockResolvedValue(
      mockUserSession as any
    );
    const jwtToken = 'this-is-special-token';
    const res = await request(app.getHttpServer())
      .post('/')
      .send({
        query: CreateSessionWithJwt,
        variables: {
          jwt: jwtToken,
        },
      });
    const session = res.body.data?.createSessionWithJWT;
    expect(res.body.errors).toBeUndefined();
    expect(sessionService.createSessionWithJWT.mock.calls).toMatchSnapshot();
    expect(session.user.email).toBe('dev@wepublish.ch');
    expect(session.token).toBeDefined();
  });
});
