import { Test, TestingModule } from '@nestjs/testing';
import { UserConsentService } from './user-consent.service';
import { PrismaClient } from '@prisma/client';
import { UserSession } from '@wepublish/authentication/api';

const mockPrisma = {
  userConsent: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('UserConsentService', () => {
  let service: UserConsentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserConsentService,
        {
          provide: PrismaClient,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UserConsentService>(UserConsentService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('should get user consents', async () => {
    const mockValue = [
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
    ];

    mockPrisma.userConsent.findMany.mockResolvedValue(mockValue);

    const result = await service.userConsentList();
    expect(result).toMatchSnapshot();
    expect(mockPrisma.userConsent.findMany.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should filter user consents', async () => {
    const mockValue = [
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
    ];

    mockPrisma.userConsent.findMany.mockResolvedValue(mockValue);

    const filter = {
      slug: 'new slug 2',
    };
    const result = await service.userConsentList(filter);
    expect(result).toMatchSnapshot();
    expect(mockPrisma.userConsent.findMany.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should get a single user consent by id', async () => {
    const mockValue = {
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
    };

    mockPrisma.userConsent.findUnique.mockResolvedValue(mockValue);

    const id = '1572bbfc-a03e-4586-b6a5-e9dab21d54d3';
    const result = await service.userConsent(id);
    expect(result).toMatchSnapshot();
    expect(
      mockPrisma.userConsent.findUnique.mock.calls[0][0]
    ).toMatchSnapshot();
  });

  test('should create a user consent', async () => {
    const mockValue = {
      id: '0c6e7727-711b-40ee-b8b8-22170a085c51',
      userId: 'clf870cla0719q1rx6vg0y2rj',
      value: true,
    };

    mockPrisma.userConsent.create.mockResolvedValue(mockValue);

    const userConsent = {
      consentId: '2152b9c8-438b-4f4a-a066-ebe85f98f607',
      userId: 'clf870cla0719q1rx6vg0y2rj',
      value: true,
    };

    const result = await service.createUserConsent(userConsent);
    expect(result).toMatchSnapshot();
    expect(mockPrisma.userConsent.create.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should update a user consent', async () => {
    const idToUpdate = 'user-consent-1';

    mockPrisma.userConsent.findFirst.mockResolvedValue({
      id: idToUpdate,
      user: { id: 'some-user-id', roleIDs: [] },
    });

    const mockValue = {
      id: idToUpdate,
      value: false,
    };

    mockPrisma.userConsent.update.mockResolvedValue(mockValue);
    const userConsent = false;

    const user = { user: { roleIDs: ['admin'] } } as UserSession;

    const result = await service.updateUserConsent(
      idToUpdate,
      userConsent,
      user
    );
    expect(result).toMatchObject({
      id: idToUpdate,
      value: false,
    });
    expect(mockPrisma.userConsent.update.mock.calls[0][0]).toMatchObject({
      where: {
        id: idToUpdate,
      },
    });
  });

  test('should delete a user consent', async () => {
    const idToDelete = 'user-consent-1';

    mockPrisma.userConsent.findFirst.mockResolvedValue({
      id: idToDelete,
      user: { id: 'some-user-id', roleIDs: [] },
    });

    const mockValue = {
      id: idToDelete,
    };

    mockPrisma.userConsent.delete.mockResolvedValue(mockValue);

    const user = { user: { roleIDs: ['admin'] } } as UserSession;

    const result = await service.deleteUserConsent(idToDelete, user);
    expect(result).toMatchObject({
      id: idToDelete,
    });
    expect(mockPrisma.userConsent.delete.mock.calls[0][0]).toMatchObject({
      where: {
        id: idToDelete,
      },
    });
  });
});
