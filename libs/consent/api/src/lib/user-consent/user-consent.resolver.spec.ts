import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { URLAdapter, URLAdapterModule } from '@wepublish/nest-modules';
import request from 'supertest';
import { UserConsentResolver } from './user-consent.resolver';
import { UserConsentService } from './user-consent.service';
import { UserDataloaderService } from '@wepublish/user/api';
import { createMock, PartialMocked } from '@wepublish/testing';

const userConsentQuery = `
  query userConsent($id: String!) {
    userConsent(id: $id) {
      id
      value
      createdAt
      modifiedAt
      consent {
        slug
        id
        name
      }
      user {
        __typename
        id
      }
    }
  }
`;

const createUserConsentMutation = `
  mutation createUserConsent($consentId: String!, $userId: String!, $value: Boolean!) {
    createUserConsent(consentId: $consentId, userId: $userId, value: $value) {
      id
      value
    }
  }
`;

const updateUserConsentMutation = `
  mutation updateUserConsent($id: String!, $value: Boolean!) {
    updateUserConsent(id: $id, value: $value) {
      id
      value
      createdAt
      modifiedAt
      consent {
        slug
        id
        name
      }
      user {
        __typename
        id
      }
    }
  }
`;

const deleteUserConsentMutation = `
  mutation deleteUserConsent($id: String!) {
    deleteUserConsent(id: $id) {
      id
    }
  }
`;

const mockUserConsent = {
  createdAt: new Date('2023-01-01'),
  id: 'userConsentId',
  modifiedAt: new Date('2023-01-01'),
  userId: 'userId',
  value: false,
  consent: {
    id: 'consentId',
    createdAt: new Date('2023-01-01'),
    modifiedAt: new Date('2023-01-01'),
    name: 'name',
    slug: 'slug',
    defaultValue: false,
  },
};

const mockUser = {
  id: 'userId',
  name: 'name',
  firstName: 'firstName',
  birthday: null,
  email: 'email',
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

describe('UserConsentResolver', () => {
  let app: INestApplication;
  let userConsentService: PartialMocked<UserConsentService>;
  let userDataloaderService: PartialMocked<UserDataloaderService>;

  beforeEach(async () => {
    userConsentService = createMock(UserConsentService);
    userDataloaderService = createMock(UserDataloaderService);

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
        URLAdapterModule.register(new URLAdapter(`https://example.com`)),
      ],
      providers: [
        UserConsentResolver,
        {
          provide: UserConsentService,
          useValue: userConsentService,
        },
        {
          provide: UserDataloaderService,
          useValue: userDataloaderService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('user consent query', async () => {
    const idToGet = 'id-to-get';

    userConsentService.userConsent?.mockResolvedValue(mockUserConsent);
    userDataloaderService.load?.mockResolvedValue(mockUser);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: userConsentQuery,
        variables: {
          id: idToGet,
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('create user consent mutation', async () => {
    userConsentService.createUserConsent?.mockResolvedValue(mockUserConsent);

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createUserConsentMutation,
        variables: {
          consentId: 'consentId',
          userId: 'userId',
          value: true,
        },
      })
      .expect(200)
      .expect(res => {
        expect(
          userConsentService.createUserConsent?.mock.calls
        ).toMatchSnapshot();
        expect(res.body).toMatchSnapshot();
      });
  });

  test('update user consent mutation', async () => {
    userConsentService.updateUserConsent?.mockResolvedValue(mockUserConsent);
    userDataloaderService.load?.mockResolvedValue(mockUser);

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateUserConsentMutation,
        variables: {
          id: 'userConsentId',
          value: false,
        },
      })
      .expect(200)
      .expect(res => {
        expect(
          userConsentService.updateUserConsent?.mock.calls
        ).toMatchSnapshot();
        expect(res.body).toMatchSnapshot();
      });
  });

  test('delete user consent mutation', async () => {
    userConsentService.deleteUserConsent?.mockResolvedValue(mockUserConsent);

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deleteUserConsentMutation,
        variables: {
          id: 'userConsentId',
        },
      })
      .expect(res => {
        expect(
          userConsentService.deleteUserConsent?.mock.calls
        ).toMatchSnapshot();
        expect(res.body).toMatchSnapshot();
      })
      .expect(200);
  });
});
