import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { ConsentResolver } from './consent.resolver';
import { ConsentService } from './consent.service';
import { createMock, PartialMocked } from '@wepublish/testing';

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

const mockConsent = {
  id: 'consent-1',
  name: 'some-name1',
  slug: 'some-slug1',
  defaultValue: true,
  createdAt: new Date('2023-01-01'),
  modifiedAt: new Date('2023-01-01'),
};

describe('ConsentResolver', () => {
  let app: INestApplication;
  let consentService: PartialMocked<ConsentService>;

  beforeAll(async () => {
    consentService = createMock(ConsentService);

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
        ConsentResolver,
        {
          provide: ConsentService,
          useValue: consentService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('consent query', async () => {
    consentService.consent?.mockResolvedValue(mockConsent);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: consentQuery,
        variables: {
          id: 'consent-1',
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.consent).toMatchObject({
          id: 'consent-1',
          name: 'some-name1',
          slug: 'some-slug1',
          defaultValue: true,
        });
      });
  });

  test('create consent mutation', async () => {
    consentService.createConsent?.mockResolvedValue(mockConsent);

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createConsentMutation,
        variables: {
          name: 'some-name',
          slug: 'some-slug',
          defaultValue: true,
        },
      })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.data.createConsent).toMatchObject({
          id: expect.any(String),
          name: 'some-name1',
          slug: 'some-slug1',
          defaultValue: true,
        });
        expect(consentService.createConsent?.mock.calls).toMatchSnapshot();
      });
  });

  test('update consent mutation', async () => {
    const updatedConsent = {
      ...mockConsent,
      name: 'changed name',
      slug: 'changed-slug',
    };
    consentService.updateConsent?.mockResolvedValue(updatedConsent);

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateConsentMutation,
        variables: {
          id: 'consent-1',
          name: 'changed name',
          slug: 'changed-slug',
          defaultValue: true,
        },
      })
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.data.updateConsent).toMatchObject({
          id: 'consent-1',
          name: 'changed name',
          slug: 'changed-slug',
          defaultValue: true,
        });
        expect(consentService.updateConsent?.mock.calls).toMatchSnapshot();
      });
  });

  test('delete consent mutation', async () => {
    consentService.deleteConsent?.mockResolvedValue(mockConsent);

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deleteConsentMutation,
        variables: {
          id: 'consent-1',
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.deleteConsent).toMatchObject({
          id: 'consent-1',
        });
        expect(consentService.deleteConsent?.mock.calls).toMatchSnapshot();
      });
  });
});
