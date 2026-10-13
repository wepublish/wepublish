import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  InvoicePaidNotifier,
  PAYMENT_METHOD_CONFIG,
} from '@wepublish/payment/api';
import { InvoiceDataloader } from './invoice.dataloader';
import { createInvoiceFilter, InvoiceService } from './invoice.service';

describe('InvoiceService.checkInvoiceStatus', () => {
  it('notifies that the invoice is paid after checking its payments', async () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-2',
          subscription: { id: 'sub-1', userID: 'user-1' },
        }),
      },
      payment: { findMany: vi.fn().mockResolvedValue([]) },
      paymentMethod: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const invoicePaidNotifier = {
      notify: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaClient, useValue: prisma },
        { provide: PAYMENT_METHOD_CONFIG, useValue: { paymentProviders: [] } },
        { provide: InvoiceDataloader, useValue: { prime: vi.fn() } },
        { provide: InvoicePaidNotifier, useValue: invoicePaidNotifier },
      ],
    }).compile();

    await module
      .get<InvoiceService>(InvoiceService)
      .checkInvoiceStatus('inv-2', 'user-1');

    expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('inv-2');
  });
});

async function setup() {
  const prisma = {
    invoice: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'inv-2',
        subscriptionID: 'sub-1',
        subscriptionPeriods: [
          { id: 'period-2', endsAt: new Date('2027-08-01T00:00:00.000Z') },
        ],
      }),
      update: vi.fn().mockImplementation(async ({ data }: any) => ({
        id: 'inv-2',
        items: [],
        ...data,
      })),
    },
    subscription: {
      update: vi.fn().mockResolvedValue({ id: 'sub-1' }),
    },
  };

  const invoicePaidNotifier = {
    notify: vi.fn().mockResolvedValue(undefined),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      InvoiceService,
      { provide: PrismaClient, useValue: prisma },
      { provide: PAYMENT_METHOD_CONFIG, useValue: { paymentProviders: [] } },
      { provide: InvoiceDataloader, useValue: { prime: vi.fn() } },
      { provide: InvoicePaidNotifier, useValue: invoicePaidNotifier },
    ],
  }).compile();

  return {
    service: module.get<InvoiceService>(InvoiceService),
    prisma,
    invoicePaidNotifier,
  };
}

describe('InvoiceService.markInvoiceAsPaid', () => {
  it('triggers the renewal success mail by default', async () => {
    const { service, prisma, invoicePaidNotifier } = await setup();

    await service.markInvoiceAsPaid('inv-2', 'admin-1');

    const paidUpdate = prisma.invoice.update.mock.calls.at(-1)?.[0];
    expect(paidUpdate.data.paidAt).toBeInstanceOf(Date);
    expect(paidUpdate.data.manuallySetAsPaidByUserId).toBe('admin-1');
    expect(paidUpdate.data.suppressRenewalSuccessMail).toBeUndefined();
    expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('inv-2');
  });

  it('suppresses the mail in the same update when asked not to send', async () => {
    const { service, prisma, invoicePaidNotifier } = await setup();

    await service.markInvoiceAsPaid('inv-2', 'admin-1', false);

    const paidUpdate = prisma.invoice.update.mock.calls.at(-1)?.[0];
    expect(paidUpdate.data.paidAt).toBeInstanceOf(Date);
    expect(paidUpdate.data.suppressRenewalSuccessMail).toBe(true);
    expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
  });
});

describe('createInvoiceFilter', () => {
  it('filters invoices containing an item with the given discount code', () => {
    expect(
      createInvoiceFilter({ discountCodeId: 'code-a' }).AND
    ).toContainEqual({
      items: {
        some: {
          discountCodeId: 'code-a',
        },
      },
    });
  });

  it('does not restrict items when no discount code is given', () => {
    expect(createInvoiceFilter({ mail: 'foo@example.com' }).AND).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ items: {} })])
    );
  });
});
