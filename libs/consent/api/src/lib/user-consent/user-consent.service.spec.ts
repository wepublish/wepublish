import { Test, TestingModule } from '@nestjs/testing';
import { UserConsentService } from './user-consent.service';
import { PrismaModule } from '@wepublish/nest-modules';
import { Prisma, PrismaClient } from '@prisma/client';
import { UserSession } from '@wepublish/authentication/api';
import { generateRandomString } from '../consent/consent.resolver.spec';

const mockSlug1 = generateRandomString();

export const mockUserConsents: Prisma.UserConsentCreateInput[] = [
  {
    consent: {
      connectOrCreate: {
        where: { id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd' },
        create: {
          name: 'some-name',
          slug: mockSlug1,
          defaultValue: true,
        },
      },
    },
    value: true,
    user: {
      connectOrCreate: {
        where: { id: 'some-id' },
        create: {
          name: 'some-name',
          email: `${generateRandomString()}@wepublish.ch`,
          password: 'some-password',
          active: true,
        },
      },
    },
  },
];

describe('UserConsentService', () => {
  let service: UserConsentService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [UserConsentService],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<UserConsentService>(UserConsentService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('should get user consents', async () => {
    const mockValue = Promise.resolve([
      {
        id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
        value: true,
        createdAt: '2023-03-17T12:08:17.277Z',
        modifiedAt: '2023-03-17T12:08:17.278Z',
        consent: {
          slug: 'newsletter-aaa',
          id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd',
          name: 'Newsletter',
        },
        user: {
          __typename: 'User',
          id: 'clfb7nce50264cvrxlliyxung',
        },
      },
      {
        id: '216d312d-f26f-4692-ad51-1591ca425d97',
        value: false,
        createdAt: '2023-03-17T11:00:48.580Z',
        modifiedAt: '2023-03-17T11:40:21.092Z',
        consent: {
          slug: 'new slug 2',
          id: '4e70d86a-e3d9-4487-9d98-6ea8e665ee46',
          name: 'new 2',
        },
        user: {
          __typename: 'User',
          id: 'clesor2a50105kgrxh0kyxmxy',
        },
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.userConsent, 'findMany')
      .mockReturnValue(mockValue as any);

    const result = await service.userConsentList();
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should filter user consents', async () => {
    const mockValue = Promise.resolve([
      {
        id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
        value: true,
        createdAt: '2023-03-17T12:08:17.277Z',
        modifiedAt: '2023-03-17T12:08:17.278Z',
        consent: {
          slug: 'newsletter-aaa',
          id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd',
          name: 'Newsletter',
        },
        user: {
          __typename: 'User',
          id: 'clfb7nce50264cvrxlliyxung',
        },
      },
      {
        id: '216d312d-f26f-4692-ad51-1591ca425d97',
        value: false,
        createdAt: '2023-03-17T11:00:48.580Z',
        modifiedAt: '2023-03-17T11:40:21.092Z',
        consent: {
          slug: 'new slug 2',
          id: '4e70d86a-e3d9-4487-9d98-6ea8e665ee46',
          name: 'new 2',
        },
        user: {
          __typename: 'User',
          id: 'clesor2a50105kgrxh0kyxmxy',
        },
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.userConsent, 'findMany')
      .mockReturnValue(mockValue as any);

    const filter = {
      slug: 'new slug 2',
    };
    const result = await service.userConsentList(filter);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should get a single user consent by id', async () => {
    const mockValue = Promise.resolve([
      {
        id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
        value: true,
        createdAt: '2023-03-17T12:08:17.277Z',
        modifiedAt: '2023-03-17T12:08:17.278Z',
        consent: {
          slug: 'newsletter-aaa',
          id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd',
          name: 'Newsletter',
        },
        user: {
          __typename: 'User',
          id: 'clfb7nce50264cvrxlliyxung',
        },
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.userConsent, 'findUnique')
      .mockReturnValue(mockValue as any);

    const id = '1572bbfc-a03e-4586-b6a5-e9dab21d54d3';
    const result = await service.userConsent(id);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should create a user consent', async () => {
    const mockValue = Promise.resolve([
      {
        id: '0c6e7727-711b-40ee-b8b8-22170a085c51',
        userId: 'clf870cla0719q1rx6vg0y2rj',
        value: true,
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.userConsent, 'create')
      .mockReturnValue(mockValue as any);

    const userConsent = {
      consentId: '2152b9c8-438b-4f4a-a066-ebe85f98f607',
      userId: 'clf870cla0719q1rx6vg0y2rj',
      value: true,
    };

    const result = await service.createUserConsent(userConsent);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should update a user consent', async () => {
    const userConsents = await Promise.all(
      mockUserConsents.map(data => prisma.userConsent.create({ data }))
    );

    const idToUpdate = userConsents[0].id;

    const mockValue = Promise.resolve([
      {
        id: idToUpdate,
        userConsent: {
          value: false,
        },
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.userConsent, 'update')
      .mockReturnValue(mockValue as any);
    const userConsent = false;

    const user = { user: { roleIDs: ['admin'] } } as UserSession;

    const result = await service.updateUserConsent(
      idToUpdate,
      userConsent,
      user
    );
    expect(result).toMatchObject([
      {
        id: idToUpdate,
        userConsent: {
          value: false,
        },
      },
    ]);
    expect(mockFunction.mock.calls[0][0]).toMatchObject({
      where: {
        id: idToUpdate,
      },
    });
  });

  test('should delete a user consent', async () => {
    const userConsents = await Promise.all(
      mockUserConsents.map(data => prisma.userConsent.create({ data }))
    );

    const idToDelete = userConsents[0].id;

    const mockValue = Promise.resolve([
      {
        id: idToDelete,
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.userConsent, 'delete')
      .mockReturnValue(mockValue as any);

    const user = { user: { roleIDs: ['admin'] } } as UserSession;

    const result = await service.deleteUserConsent(idToDelete, user);
    expect(result).toMatchObject([
      {
        id: idToDelete,
      },
    ]);
    expect(mockFunction.mock.calls[0][0]).toMatchObject({
      where: {
        id: idToDelete,
      },
    });
  });
});
