import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SellableKind } from '@prisma/client';
import {
  InvoicePaidNotifier,
  PAYMENT_METHOD_CONFIG,
} from '@wepublish/payment/api';
import { InvoiceDataloader } from './invoice.dataloader';
import { createInvoiceFilter, InvoiceService } from './invoice.service';
import { UpdateInvoiceInput } from './invoice.model';

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

  // An abandoned checkout the provider no longer knows must not stop the
  // invoice from being settled through the payment that went through.
  it('checks the remaining payments when one cannot be checked', async () => {
    const intentState = { paymentID: 'pay-new', state: 'paid' };
    const provider = {
      id: 'payrexx',
      checkIntentStatus: vi
        .fn()
        .mockRejectedValueOnce(
          new Error('Payrexx Gateway/Transaction not found')
        )
        .mockResolvedValueOnce(intentState),
      updatePaymentWithIntentState: vi.fn().mockResolvedValue({}),
    };
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-2',
          subscription: { id: 'sub-1', userID: 'user-1' },
        }),
      },
      payment: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'pay-abandoned', intentID: '1', paymentMethodID: 'pm-1' },
          { id: 'pay-new', intentID: '2', paymentMethodID: 'pm-1' },
        ]),
      },
      paymentMethod: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: 'pm-1', paymentProviderID: 'payrexx' }]),
      },
    };
    const invoicePaidNotifier = {
      notify: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaClient, useValue: prisma },
        {
          provide: PAYMENT_METHOD_CONFIG,
          useValue: { paymentProviders: [provider] },
        },
        { provide: InvoiceDataloader, useValue: { prime: vi.fn() } },
        { provide: InvoicePaidNotifier, useValue: invoicePaidNotifier },
      ],
    }).compile();

    await module
      .get<InvoiceService>(InvoiceService)
      .checkInvoiceStatus('inv-2', 'user-1');

    expect(provider.updatePaymentWithIntentState).toHaveBeenCalledWith({
      intentState,
    });
    expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('inv-2');
  });

  it('lets the buyer of a subscription-less invoice check it', async () => {
    const { service, invoicePaidNotifier } = await setupCheck({
      id: 'inv-3',
      subscription: null,
      userID: 'buyer-1',
    });

    await service.checkInvoiceStatus('inv-3', 'buyer-1');

    expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('inv-3');
  });

  it('does not let another user check a subscription-less invoice', async () => {
    const { service, invoicePaidNotifier } = await setupCheck({
      id: 'inv-3',
      subscription: null,
      userID: 'buyer-1',
    });

    await expect(
      service.checkInvoiceStatus('inv-3', 'someone-else')
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
  });

  it('does not let the buyer field grant access to a subscription invoice of another user', async () => {
    const { service } = await setupCheck({
      id: 'inv-4',
      subscription: { id: 'sub-1', userID: 'subscriber-1' },
      userID: 'buyer-1',
    });

    await expect(
      service.checkInvoiceStatus('inv-4', 'buyer-1')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a missing invoice', async () => {
    const { service } = await setupCheck(null);

    await expect(
      service.checkInvoiceStatus('inv-6', 'buyer-1')
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

async function setupCheck(invoice: unknown) {
  const prisma = {
    invoice: {
      findUnique: vi.fn().mockResolvedValue(invoice),
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

  return {
    service: module.get<InvoiceService>(InvoiceService),
    prisma,
    invoicePaidNotifier,
  };
}

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
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
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

describe('InvoiceService.markInvoiceAsPaid for a sellable invoice', () => {
  async function setupSellable(
    sellableKind: SellableKind | null = SellableKind.giftCode
  ) {
    const context = await setup();
    const reloaded = { id: 'inv-9', paidAt: new Date(), items: [] };
    context.prisma.invoice.findUnique
      .mockReset()
      .mockResolvedValueOnce({
        id: 'inv-9',
        subscriptionID: null,
        sellableKind,
        userID: 'buyer-1',
        subscriptionPeriods: [],
      })
      .mockResolvedValueOnce(reloaded);

    return { ...context, reloaded };
  }

  it('settles it as paid by the admin and notifies even without a mail', async () => {
    const { service, prisma, invoicePaidNotifier, reloaded } =
      await setupSellable();

    const result = await service.markInvoiceAsPaid('inv-9', 'admin-1', false);

    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-9', paidAt: null, canceledAt: null },
      data: { paidAt: expect.any(Date), manuallySetAsPaidByUserId: 'admin-1' },
    });
    expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('inv-9');
    expect(prisma.invoice.findUnique).toHaveBeenLastCalledWith({
      where: { id: 'inv-9' },
      include: { items: true },
    });
    expect(result).toBe(reloaded);
  });

  it('never touches a subscription or the renewal mail flag', async () => {
    const { service, prisma } = await setupSellable();

    await service.markInvoiceAsPaid('inv-9', 'admin-1', false);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('settles before it notifies', async () => {
    const { service, prisma, invoicePaidNotifier } = await setupSellable();
    const order: string[] = [];
    prisma.invoice.updateMany.mockImplementation(async () => {
      order.push('settle');
      return { count: 1 };
    });
    invoicePaidNotifier.notify.mockImplementation(async () => {
      order.push('notify');
    });

    await service.markInvoiceAsPaid('inv-9', 'admin-1');

    expect(order).toEqual(['settle', 'notify']);
  });

  it('refuses to mark a canceled invoice as paid', async () => {
    const { service, prisma, invoicePaidNotifier } = await setupSellable();
    prisma.invoice.findUnique.mockReset().mockResolvedValueOnce({
      id: 'inv-9',
      subscriptionID: null,
      sellableKind: SellableKind.giftCode,
      userID: 'buyer-1',
      canceledAt: new Date(),
      subscriptionPeriods: [],
    });

    await expect(service.markInvoiceAsPaid('inv-9', 'admin-1')).rejects.toThrow(
      new BadRequestException('Canceled invoices cannot be marked as paid.')
    );
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
  });

  it('keeps rejecting a subscription-less invoice that sells nothing', async () => {
    const { service, prisma, invoicePaidNotifier } = await setupSellable(null);

    await expect(service.markInvoiceAsPaid('inv-9', 'admin-1')).rejects.toThrow(
      new NotFoundException('Subscription not found')
    );
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
  });
});

async function setupWrite(sellableKind: SellableKind | null) {
  const prisma = {
    invoice: {
      findUnique: vi.fn().mockResolvedValue({ sellableKind }),
      delete: vi.fn().mockResolvedValue({ id: 'inv-1' }),
      update: vi.fn().mockResolvedValue({ id: 'inv-1', items: [] }),
    },
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      InvoiceService,
      { provide: PrismaClient, useValue: prisma },
      { provide: PAYMENT_METHOD_CONFIG, useValue: { paymentProviders: [] } },
      { provide: InvoiceDataloader, useValue: { prime: vi.fn() } },
      { provide: InvoicePaidNotifier, useValue: { notify: vi.fn() } },
    ],
  }).compile();

  return { service: module.get<InvoiceService>(InvoiceService), prisma };
}

describe('InvoiceService.deleteInvoice', () => {
  it('refuses to delete an invoice that sells products', async () => {
    const { service, prisma } = await setupWrite(SellableKind.giftCode);

    await expect(service.deleteInvoice('inv-1')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      select: { sellableKind: true },
    });
    expect(prisma.invoice.delete).not.toHaveBeenCalled();
  });

  it('deletes an invoice that sells nothing', async () => {
    const { service, prisma } = await setupWrite(null);

    await service.deleteInvoice('inv-1');

    expect(prisma.invoice.delete).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
    });
  });
});

describe('InvoiceService.updateInvoice', () => {
  const items = [{ name: 'Item', quantity: 1, amount: 100 }];

  it('refuses to replace the items of an invoice that sells products', async () => {
    const { service, prisma } = await setupWrite(SellableKind.giftCode);

    await expect(
      service.updateInvoice({ id: 'inv-1', items } as UpdateInvoiceInput)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      select: { sellableKind: true },
    });
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('replaces the items of an invoice that sells nothing', async () => {
    const { service, prisma } = await setupWrite(null);

    await service.updateInvoice({ id: 'inv-1', items } as UpdateInvoiceInput);

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: expect.objectContaining({ createMany: { data: items } }),
        }),
      })
    );
  });

  it('refuses to link an invoice that sells products to a subscription', async () => {
    const { service, prisma } = await setupWrite(SellableKind.giftCode);

    await expect(
      service.updateInvoice({
        id: 'inv-1',
        subscriptionID: 'sub-1',
      } as UpdateInvoiceInput)
    ).rejects.toThrow(
      new BadRequestException(
        'Invoices that sell products cannot be linked to a subscription.'
      )
    );
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('links an invoice that sells nothing to a subscription', async () => {
    const { service, prisma } = await setupWrite(null);

    await service.updateInvoice({
      id: 'inv-1',
      subscriptionID: 'sub-1',
    } as UpdateInvoiceInput);

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subscriptionID: 'sub-1' }),
      })
    );
  });

  it('still updates other fields of an invoice that sells products', async () => {
    const { service, prisma } = await setupWrite(SellableKind.giftCode);

    await service.updateInvoice({
      id: 'inv-1',
      description: 'New',
    } as UpdateInvoiceInput);

    expect(prisma.invoice.findUnique).not.toHaveBeenCalled();
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: 'New', items: undefined }),
      })
    );
  });
});

describe('createInvoiceFilter', () => {
  it('finds the invoices of a user through the subscription or as the buyer', () => {
    expect(createInvoiceFilter({ userID: 'user-1' }).AND).toContainEqual({
      OR: [{ subscription: { userID: 'user-1' } }, { userID: 'user-1' }],
    });
  });

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
