import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@wepublish/session/api';
import { createMock, PartialMocked } from '@wepublish/testing';
import { generateKeyPairSync } from 'crypto';
import { decodeJwt } from 'jose';
import request from 'supertest';

import { ExternalAppsDataloaderService } from './external-apps-dataloader.service';
import { ExternalAppsUserinfoController } from './external-apps-userinfo.controller';
import { ExternalAppsResolver } from './external-apps.resolver';
import { ExternalAppsService } from './external-apps.service';

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const API_URL = 'https://api.example.com';
const TOKEN_MINUTES = 240;

const CreateExternalAppToken = `
  mutation CreateExternalAppToken($externalAppId: String!) {
    createExternalAppToken(externalAppId: $externalAppId) {
      token
      expiresAt
    }
  }
`;

const mockUser = {
  id: 'user-1',
  name: 'Muster',
  firstName: 'Max',
  birthday: null,
  email: 'max@example.com',
  active: true,
  flair: null,
  userImageID: null,
  roleIDs: [],
};

const mockUserSession = {
  type: 'user',
  id: 'session-1',
  token: 'some-token',
  user: mockUser,
};

const externalApp = (url: string) => ({
  id: 'app-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  modifiedAt: new Date('2026-01-01T00:00:00.000Z'),
  name: 'Tool',
  description: null,
  url,
  target: 'IFRAME',
  icon: null,
});

describe('ExternalAppsResolver', () => {
  let app: INestApplication;
  let externalAppsService: PartialMocked<ExternalAppsService>;
  let load: ReturnType<typeof vi.fn>;
  let jwtService: JwtService;

  beforeEach(async () => {
    externalAppsService = createMock(ExternalAppsService);
    load = vi.fn();
    jwtService = new JwtService(
      privateKey as string,
      publicKey as string,
      API_URL,
      'https://www.example.com'
    );

    const module = await Test.createTestingModule({
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
        ExternalAppsResolver,
        { provide: ExternalAppsService, useValue: externalAppsService },
        { provide: ExternalAppsDataloaderService, useValue: { load } },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterEach(async () => {
    await app.close();
  });

  const mintToken = async (externalAppId = 'app-1') => {
    const res = await request(app.getHttpServer()).post('/').send({
      query: CreateExternalAppToken,
      variables: { externalAppId },
    });

    return res.body as {
      data?: { createExternalAppToken: { token: string; expiresAt: string } };
      errors?: { message: string }[];
    };
  };

  describe('createExternalAppToken', () => {
    // The userinfo endpoint compares the audience with the app's origin, so a
    // token for an app registered with a path or trailing slash must carry the
    // origin, not the full address.
    it.each([
      'https://tool.example.com',
      'https://tool.example.com/',
      'https://tool.example.com/some/path?x=1',
    ])('signs the token for the origin of the app (%s)', async url => {
      load.mockResolvedValue(externalApp(url));
      const before = Date.now();

      const { data, errors } = await mintToken();

      expect(errors).toBeUndefined();
      const payload = decodeJwt(data!.createExternalAppToken.token);
      expect(payload.aud).toBe('https://tool.example.com');
      expect(payload.sub).toBe('user-1');
      expect(payload.iss).toBe(API_URL);

      // the token has no iat claim, so both expiries are checked against now
      const expected = before + TOKEN_MINUTES * 60 * 1000;
      expect(Math.abs(payload.exp! * 1000 - expected)).toBeLessThan(5000);
      const expiresAt = new Date(data!.createExternalAppToken.expiresAt);
      expect(Math.abs(expiresAt.getTime() - expected)).toBeLessThan(5000);
    });

    it('fails for an unknown app', async () => {
      load.mockResolvedValue(null);

      const { data, errors } = await mintToken('missing');

      expect(data).toBeNull();
      expect(errors?.[0].message).toMatch(/not found/);
    });
  });

  describe('userinfo round trip', () => {
    const prisma = {
      user: { findUnique: vi.fn() },
      userRole: { findMany: vi.fn() },
    };

    const userinfo = () =>
      new ExternalAppsUserinfoController(
        jwtService,
        prisma as unknown as PrismaClient,
        externalAppsService as unknown as ExternalAppsService
      );

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userRole.findMany.mockResolvedValue([]);
    });

    it('accepts a token minted for an app registered with a path', async () => {
      const app = externalApp('https://tool.example.com/some/path');
      load.mockResolvedValue(app);
      externalAppsService.externalAppsList!.mockResolvedValue([app]);

      const { data } = await mintToken();
      const info = await userinfo().getUserinfo(
        `Bearer ${data!.createExternalAppToken.token}`
      );

      expect(info).toEqual({
        id: 'user-1',
        email: 'max@example.com',
        name: 'Muster',
        firstName: 'Max',
        flair: null,
        roles: [],
      });
    });

    it('rejects a token issued for an unregistered audience', async () => {
      externalAppsService.externalAppsList!.mockResolvedValue([
        externalApp('https://tool.example.com'),
      ]);
      const token = await jwtService.generateJWT({
        id: 'user-1',
        audience: 'https://evil.example.com',
      });

      await expect(userinfo().getUserinfo(`Bearer ${token}`)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
