import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { createMock, PartialMocked } from '@wepublish/testing';
import snapshotDiff from 'snapshot-diff';
import { UserService } from './user.service';
import { ProfileService } from './profile.service';
import { ProfileResolver } from './profile.resolver';

const UpdatePaymentProviderCustomers = `
  mutation UpdatePaymentProviderCustomers($customers: [PaymentProviderCustomerInput!]!) {
    updatePaymentProviderCustomers(input: $customers) {
      customerID
      paymentProviderID
    }
  }
`;

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

describe('ProfileResolver', () => {
  let app: INestApplication;

  let userService: PartialMocked<UserService>;
  let profileService: PartialMocked<ProfileService>;

  beforeEach(async () => {
    userService = createMock(UserService);
    profileService = createMock(ProfileService);

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
        ProfileResolver,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: ProfileService,
          useValue: profileService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('can add payment provider customers', async () => {
    const paymentProviderCustomers = [
      {
        paymentProviderID: '123-123',
        customerID: '1234-1234',
      },
      {
        paymentProviderID: '122-122',
        customerID: '1233-1233',
      },
    ];
    profileService.updatePaymentProviderCustomers?.mockResolvedValue({
      ...mockUser,
      paymentProviderCustomers,
    });

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: UpdatePaymentProviderCustomers,
        variables: {
          customers: paymentProviderCustomers,
        },
      })
      .expect(res => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).toMatchSnapshot();
      });
  });

  test('can update payment provider customers', async () => {
    const paymentProviderCustomers = [
      {
        paymentProviderID: '123-123',
        customerID: '1234-1234',
      },
    ];
    profileService.updatePaymentProviderCustomers?.mockResolvedValue({
      ...mockUser,
      paymentProviderCustomers,
    });
    const addPaymentProviderCustomers = await request(app.getHttpServer())
      .post('/')
      .send({
        query: UpdatePaymentProviderCustomers,
        variables: {
          customers: paymentProviderCustomers,
        },
      });

    const paymentProviderCustomersExtra = [
      {
        paymentProviderID: '122-122',
        customerID: '1233-1233',
      },
    ];
    profileService.updatePaymentProviderCustomers?.mockResolvedValue({
      ...mockUser,
      paymentProviderCustomers: [
        ...paymentProviderCustomers,
        ...paymentProviderCustomersExtra,
      ],
    });

    const updatePaymentProviderCustomers = await request(app.getHttpServer())
      .post('/')
      .send({
        query: UpdatePaymentProviderCustomers,
        variables: {
          customers: paymentProviderCustomersExtra,
        },
      });

    expect(addPaymentProviderCustomers.body.errors).toBeUndefined();
    expect(updatePaymentProviderCustomers.body.errors).toBeUndefined();
    expect(
      snapshotDiff(
        addPaymentProviderCustomers.body,
        updatePaymentProviderCustomers.body
      )
    ).toMatchSnapshot();
  });
});
