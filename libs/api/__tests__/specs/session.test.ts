import { ApolloServer } from 'apollo-server-express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { CreateSession, CreateSessionWithJwt } from '../api/private';

import { createGraphQLTestClientWithPrisma } from '../utility';

let testServerPrivate: ApolloServer;
let userId: string;

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma();
    testServerPrivate = setupClient.testServerPrivate;
    const adminUser = await setupClient.prisma.user.findUnique({
      where: {
        email: 'dev@wepublish.ch',
      },
    });
    userId = adminUser.id;
  } catch (error) {
    console.log('Error', error);
    throw new Error('Error during test setup');
  }
});

describe('Sessions', () => {
  describe('Admin API', () => {
    test('can be created via mail and password', async () => {
      const res = await testServerPrivate.executeOperation({
        query: CreateSession,
        variables: {
          email: 'dev@wepublish.ch',
          password: '123',
        },
      });
      const session = res.data?.createSession;
      expect(session.user.email).toBe('dev@wepublish.ch');
      expect(session.token).toBeDefined();
    });

    test('can be create via JWT', async () => {
      const jwtOptions: SignOptions = {
        issuer: 'https://fakeURL',
        audience: 'https://fakeURL',
        algorithm: 'HS256',
        expiresIn: `5m`,
      };

      if (!process.env.JWT_SECRET_KEY) {
        throw Error('JWT_SECRET_KEY needed for tests');
      }

      const token = jwt.sign(
        { sub: userId },
        process.env.JWT_SECRET_KEY,
        jwtOptions
      );

      const res = await testServerPrivate.executeOperation({
        query: CreateSessionWithJwt,
        variables: {
          jwt: token,
        },
      });

      const session = res.data?.createSessionWithJWT;
      expect(session.user.email).toBe('dev@wepublish.ch');
      expect(session.token).toBeDefined();
    });
  });
});
