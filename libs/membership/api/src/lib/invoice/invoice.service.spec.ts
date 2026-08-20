import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { PAYMENT_METHOD_CONFIG } from '@wepublish/payment/api';
import { RenewalSuccessMailService } from '../renewal-mail/renewal-success-mail.service';
import { InvoiceDataloader } from './invoice.dataloader';
import { InvoiceService } from './invoice.service';

describe('InvoiceService.checkInvoiceStatus', () => {
  it('notifies that the invoice is paid after checking its payments', async () => {
    const prisma = {
      invoice: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'inv-2',
          subscription: { id: 'sub-1', userID: 'user-1' },
        }),
      },
      payment: { findMany: jest.fn().mockResolvedValue([]) },
      paymentMethod: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const renewalSuccessMail = {
      onInvoicePaid: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaClient, useValue: prisma },
        { provide: PAYMENT_METHOD_CONFIG, useValue: { paymentProviders: [] } },
        { provide: InvoiceDataloader, useValue: { prime: jest.fn() } },
        { provide: RenewalSuccessMailService, useValue: renewalSuccessMail },
      ],
    }).compile();

    await module
      .get<InvoiceService>(InvoiceService)
      .checkInvoiceStatus('inv-2', 'user-1');

    expect(renewalSuccessMail.onInvoicePaid).toHaveBeenCalledWith('inv-2');
  });
});

async function setup() {
  const prisma = {
    invoice: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'inv-2',
        subscriptionID: 'sub-1',
        subscriptionPeriods: [
          { id: 'period-2', endsAt: new Date('2027-08-01T00:00:00.000Z') },
        ],
      }),
      update: jest.fn().mockImplementation(async ({ data }: any) => ({
        id: 'inv-2',
        items: [],
        ...data,
      })),
    },
    subscription: {
      update: jest.fn().mockResolvedValue({ id: 'sub-1' }),
    },
  };

  const renewalSuccessMail = {
    onInvoicePaid: jest.fn().mockResolvedValue(undefined),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      InvoiceService,
      { provide: PrismaClient, useValue: prisma },
      { provide: PAYMENT_METHOD_CONFIG, useValue: { paymentProviders: [] } },
      { provide: InvoiceDataloader, useValue: { prime: jest.fn() } },
      { provide: RenewalSuccessMailService, useValue: renewalSuccessMail },
    ],
  }).compile();

  return {
    service: module.get<InvoiceService>(InvoiceService),
    prisma,
    renewalSuccessMail,
  };
}

describe('InvoiceService.markInvoiceAsPaid', () => {
  it('triggers the renewal success mail by default', async () => {
    const { service, prisma, renewalSuccessMail } = await setup();

    await service.markInvoiceAsPaid('inv-2', 'admin-1');

    const paidUpdate = prisma.invoice.update.mock.calls.at(-1)?.[0];
    expect(paidUpdate.data.paidAt).toBeInstanceOf(Date);
    expect(paidUpdate.data.manuallySetAsPaidByUserId).toBe('admin-1');
    expect(paidUpdate.data.suppressRenewalSuccessMail).toBeUndefined();
    expect(renewalSuccessMail.onInvoicePaid).toHaveBeenCalledWith('inv-2');
  });

  it('suppresses the mail in the same update when asked not to send', async () => {
    const { service, prisma, renewalSuccessMail } = await setup();

    await service.markInvoiceAsPaid('inv-2', 'admin-1', false);

    const paidUpdate = prisma.invoice.update.mock.calls.at(-1)?.[0];
    expect(paidUpdate.data.paidAt).toBeInstanceOf(Date);
    expect(paidUpdate.data.suppressRenewalSuccessMail).toBe(true);
    expect(renewalSuccessMail.onInvoicePaid).not.toHaveBeenCalled();
  });
});
