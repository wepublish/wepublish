import { Test, TestingModule } from '@nestjs/testing';
import { ConsentService } from './consent.service';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
  consent: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ConsentService', () => {
  let service: ConsentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        {
          provide: PrismaClient,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('should get consents', async () => {
    const mockValue = [
      {
        id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
        name: 'some-name',
        slug: 'some-slug',
        defaultValue: true,
      },
      {
        id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
        name: 'some-other-name',
        slug: 'some-other-slug',
        defaultValue: false,
      },
    ];

    mockPrisma.consent.findMany.mockResolvedValue(mockValue);

    const result = await service.consentList();
    expect(result).toMatchSnapshot();
    expect(mockPrisma.consent.findMany.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should get a single consent by id', async () => {
    const mockValue = {
      id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
      name: 'some-name',
      slug: 'some-slug',
      defaultValue: true,
    };

    mockPrisma.consent.findUnique.mockResolvedValue(mockValue);

    const id = '1572bbfc-a03e-4586-b6a5-e9dab21d54d3';
    const result = await service.consent(id);
    expect(result).toMatchSnapshot();
    expect(mockPrisma.consent.findUnique.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should create a consent', async () => {
    const mockValue = {
      id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
      name: 'some-name',
      slug: 'some-slug',
      defaultValue: true,
    };

    mockPrisma.consent.create.mockResolvedValue(mockValue);

    const consent = {
      name: 'some-name',
      slug: 'some-slug',
      defaultValue: true,
    };

    const result = await service.createConsent(consent);
    expect(result).toMatchSnapshot();
    expect(mockPrisma.consent.create.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should update a consent', async () => {
    const idToUpdate = 'consent-1';

    const mockValue = {
      id: idToUpdate,
      name: 'some-name',
      slug: 'some-slug',
      defaultValue: false,
    };

    mockPrisma.consent.update.mockResolvedValue(mockValue);

    const consent = {
      name: 'some-name',
      slug: 'some-slug',
      defaultValue: false,
    };

    const result = await service.updateConsent({ id: idToUpdate, ...consent });
    expect(result).toMatchObject({
      id: idToUpdate,
      defaultValue: false,
    });
    expect(mockPrisma.consent.update.mock.calls[0][0]).toMatchObject({
      where: {
        id: idToUpdate,
      },
    });
  });

  test('should delete a consent', async () => {
    const idToDelete = 'consent-1';

    const mockValue = {
      id: idToDelete,
    };

    mockPrisma.consent.delete.mockResolvedValue(mockValue);

    const result = await service.deleteConsent(idToDelete);
    expect(result).toMatchObject({
      id: idToDelete,
    });
    expect(mockPrisma.consent.delete.mock.calls[0][0]).toMatchObject({
      where: {
        id: idToDelete,
      },
    });
  });
});
