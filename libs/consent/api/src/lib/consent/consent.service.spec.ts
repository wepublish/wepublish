import { Test, TestingModule } from '@nestjs/testing';
import { ConsentService } from './consent.service';
import { PrismaModule } from '@wepublish/nest-modules';
import { Consent, PrismaClient } from '@prisma/client';
import { mockConsents } from './consent.resolver.spec';

describe('ConsentService', () => {
  let service: ConsentService;
  let prisma: PrismaClient;
  let consents: Consent[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [ConsentService],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<ConsentService>(ConsentService);

    consents = await Promise.all(
      mockConsents.map(data => prisma.consent.create({ data }))
    );
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('should get consents', async () => {
    const mockValue = Promise.resolve([
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
    ]);

    const mockFunction = jest
      .spyOn(prisma.consent, 'findMany')
      .mockReturnValue(mockValue as any);

    const result = await service.consentList();
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should get a single consent by id', async () => {
    const mockValue = Promise.resolve([
      {
        id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
        name: 'some-name',
        slug: 'some-slug',
        defaultValue: true,
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.consent, 'findUnique')
      .mockReturnValue(mockValue as any);

    const id = '1572bbfc-a03e-4586-b6a5-e9dab21d54d3';
    const result = await service.consent(id);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should create a consent', async () => {
    const mockValue = Promise.resolve([
      {
        id: '1572bbfc-a03e-4586-b6a5-e9dab21d54d3',
        name: 'some-name',
        slug: 'some-slug',
        defaultValue: true,
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.consent, 'create')
      .mockReturnValue(mockValue as any);

    const consent = {
      name: 'some-name',
      slug: 'some-slug',
      defaultValue: true,
    };

    const result = await service.createConsent(consent);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should update a consent', async () => {
    const idToUpdate = consents[0].id;

    const mockValue = Promise.resolve([
      {
        id: idToUpdate,
        consent: {
          defaultValue: false,
        },
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.consent, 'update')
      .mockReturnValue(mockValue as any);

    const consent = {
      name: consents[0].name,
      slug: consents[0].slug,
      defaultValue: false,
    };

    const result = await service.updateConsent({ id: idToUpdate, ...consent });
    expect(result).toMatchObject([
      {
        id: idToUpdate,
        consent: {
          defaultValue: false,
        },
      },
    ]);
    expect(mockFunction.mock.calls[0][0]).toMatchObject({
      where: {
        id: idToUpdate,
      },
    });
  });

  test('should delete a consent', async () => {
    const idToDelete = consents[0].id;

    const mockValue = Promise.resolve([
      {
        id: idToDelete,
      },
    ]);

    const mockFunction = jest
      .spyOn(prisma.consent, 'delete')
      .mockReturnValue(mockValue as any);

    const result = await service.deleteConsent(idToDelete);
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
