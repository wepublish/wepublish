import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import * as crypto from 'crypto';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { PrismaClient, Prisma, Consent } from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { ConsentResolver } from './consent.resolver';
import { ConsentService } from './consent.service';

export const generateRandomString = () =>
  crypto.randomBytes(20).toString('hex');

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
      cache: 'bounded',
    }),
    PrismaModule,
  ],
  providers: [ConsentResolver, ConsentService],
})
export class AppModule {}

const consentQuery = `
  query consent($id: String!) {
    consent(id: $id) {
      id
      name
      slug
      defaultValue
      createdAt
      modifiedAt
    }
  }
`;

const createConsentMutation = `
  mutation createConsent($name: String!, $slug: String!, $defaultValue: Boolean!) {
    createConsent(name: $name, slug: $slug, defaultValue: $defaultValue) {
      id
      createdAt
      modifiedAt
      name
      slug
      defaultValue
    }
  }
`;

const updateConsentMutation = `
  mutation updateConsent($id: String!, $name: String, $slug: String, $defaultValue: Boolean) {
    updateConsent(id: $id, name: $name, slug: $slug, defaultValue: $defaultValue) {
      id
      createdAt
      modifiedAt
      name
      slug
      defaultValue
    }
  }
`;

const deleteConsentMutation = `
  mutation deleteConsent($id: String!) {
    deleteConsent(id: $id) {
      id
    }
  }
`;

export const mockConsents: Prisma.ConsentCreateInput[] = [
  {
    name: 'some-name1',
    slug: generateRandomString(),
    defaultValue: true,
  },
];

describe('ConsentResolver', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let consents: Consent[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    app = module.createNestApplication();
    await app.init();

    consents = await Promise.all(
      mockConsents.map(data => prisma.consent.create({ data }))
    );
  });

  afterAll(async () => {
    await app.close();
  });

  test('consent query', async () => {
    const idToGet = consents[0].id;

    await request(app.getHttpServer())
      .post('')
      .send({
        query: consentQuery,
        variables: {
          id: idToGet,
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.consent).toMatchObject({
          id: expect.any(String),
          name: 'some-name1',
          slug: consents[0].slug,
          defaultValue: true,
        });
      });
  });

  test('create consent mutation', async () => {
    const toCreate = {
      name: 'some-name',
      slug: generateRandomString(),
      defaultValue: true,
    };

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createConsentMutation,
        variables: toCreate,
      })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.data.createConsent).toMatchObject({
          id: expect.any(String),
          name: 'some-name',
          slug: toCreate.slug,
          defaultValue: true,
        });
      });
  });

  test('update consent mutation', async () => {
    const idToUpdate = consents[0].id;

    const toUpdate = {
      name: 'changed name',
      slug: generateRandomString(),
      defaultValue: true,
    };

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateConsentMutation,
        variables: {
          id: idToUpdate,
          ...toUpdate,
        },
      })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.data.updateConsent).toMatchObject({
          id: idToUpdate,
          name: 'changed name',
          slug: toUpdate.slug,
          defaultValue: true,
        });
      });
  });

  test('delete consent mutation', async () => {
    const idToDelete = consents[0].id;

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deleteConsentMutation,
        variables: {
          id: idToDelete,
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.deleteConsent).toMatchObject({
          id: idToDelete,
        });
      });
  });
});
