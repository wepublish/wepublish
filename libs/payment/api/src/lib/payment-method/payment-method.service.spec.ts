import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethodDataloader } from './payment-method.dataloader';
import {
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
} from './payment-method.model';
import { PrismaClient } from '@prisma/client';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let dataloader: { [method in keyof PaymentMethodDataloader]?: jest.Mock };
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      paymentMethod: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    dataloader = {
      prime: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodService,
        { provide: PaymentMethodDataloader, useValue: dataloader },
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PaymentMethodService>(PaymentMethodService);
  });

  it('should get payment methods', async () => {
    prismaMock.paymentMethod.findMany.mockResolvedValueOnce([
      {
        id: '1',
        name: 'method1',
        slug: 'method-1',
        description: 'Test Method 1',
        paymentProviderID: 'provider1',
        active: true,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        modifiedAt: new Date('2023-01-01T00:00:00Z'),
      },
      {
        id: '2',
        name: 'method2',
        slug: 'method-2',
        description: 'Test Method 2',
        paymentProviderID: 'provider2',
        active: false,
        createdAt: new Date('2023-01-02T00:00:00Z'),
        modifiedAt: new Date('2023-01-02T00:00:00Z'),
      },
    ]);
    await service.getPaymentMethods();
    expect(prismaMock.paymentMethod.findMany).toHaveBeenCalled();
    expect(prismaMock.paymentMethod.findMany.mock.calls[0]).toMatchSnapshot();
    expect(dataloader.prime).toHaveBeenCalled();
  });

  it('should create a payment method', async () => {
    const paymentMethod: CreatePaymentMethodInput = {
      name: 'newMethod',
      slug: 'new-method',
      description: 'New Method Description',
      paymentProviderID: 'provider1',
      active: true,
      gracePeriod: 0,
    };
    prismaMock.paymentMethod.create.mockResolvedValueOnce({
      id: '3',
      ...paymentMethod,
      createdAt: new Date('2023-01-03T00:00:00Z'),
      modifiedAt: new Date('2023-01-03T00:00:00Z'),
    });
    await service.createPaymentMethod(paymentMethod);
    expect(prismaMock.paymentMethod.create).toHaveBeenCalled();
    expect(prismaMock.paymentMethod.create.mock.calls[0]).toMatchSnapshot();
    expect(dataloader.prime).toHaveBeenCalled();
  });

  it('should update a payment method', async () => {
    const paymentMethod: UpdatePaymentMethodInput = {
      id: '1',
      name: 'updatedMethod',
      slug: 'updated-method',
      description: 'Updated Method Description',
      paymentProviderID: 'provider1',
      active: true,
    };
    prismaMock.paymentMethod.update.mockResolvedValueOnce({
      ...paymentMethod,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-04T00:00:00Z'),
    });
    await service.updatePaymentMethod(paymentMethod);
    expect(prismaMock.paymentMethod.update).toHaveBeenCalled();
    expect(prismaMock.paymentMethod.update.mock.calls[0]).toMatchSnapshot();
    expect(dataloader.prime).toHaveBeenCalled();
  });

  it('should delete a payment method by id', async () => {
    prismaMock.paymentMethod.delete.mockResolvedValueOnce({
      id: '1',
      name: 'deletedMethod',
      slug: 'deleted-method',
      description: 'Deleted Method Description',
      paymentProviderID: 'provider1',
      active: false,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-01T00:00:00Z'),
    });
    await service.deletePaymentMethod('1');
    expect(prismaMock.paymentMethod.delete).toHaveBeenCalled();
    expect(prismaMock.paymentMethod.delete.mock.calls[0]).toMatchSnapshot();
    expect(dataloader.prime).not.toHaveBeenCalled();
  });
});
