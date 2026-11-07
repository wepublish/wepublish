import { BexioPaymentProvider } from '../bexio/bexio-payment-provider';
import {
  Currency,
  InvoiceItem,
  MailChannel,
  PaymentPeriodicity,
  PaymentState,
} from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { CreatePaymentIntentProps } from '../payment-provider';
import { BexioCountries } from './bexio-countries';

vi.mock('axios');

const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@prisma/client', async () => {
  const originalModule = await vi.importActual('@prisma/client');
  return {
    __esModule: true,
    ...originalModule,
    PrismaClient: vi.fn().mockImplementation(() => ({
      payment: {
        findFirst: mockFindFirst,
      },
      invoice: {
        findUnique: mockFindUnique,
      },
    })),
  };
});

vi.mock('node-fetch', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          kb_item_status_id: 9,
          payment_type_id: 123,
          contact_id: 321,
        }),
      status: 200,
    })
  ),
}));

const mockLoggerError = vi.fn();

vi.mock('@wepublish/utils/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/utils/api')>()),
  logger: () => ({ error: mockLoggerError, warn: vi.fn(), info: vi.fn() }),
}));

const mockBexioInvoiceCancel = vi.fn();
const mockBexioInvoiceSend = vi.fn();
const mockBexioInvoiceIssue = vi.fn();
const mockBexioInvoiceShowPdf = vi.fn();
const mockBexioContactSearch = vi.fn();
const mockBexioContactCreate = vi.fn();
const mockBexioContactEdit = vi.fn();
const mockBexioContactShow = vi.fn();

vi.mock('bexio', () => {
  const ContactsStatic = {
    ContactSearchParameters: {
      mail: 'mockMailParameter',
    },
  };

  const Bexio = vi.fn().mockImplementation(function () {
    return {
      contacts: {
        search: mockBexioContactSearch,
        create: mockBexioContactCreate,
        edit: mockBexioContactEdit,
        show: mockBexioContactShow,
      },
      invoices: {
        create: vi.fn().mockImplementation(() => ({
          id: 'testid',
          intentID: '12345',
          state: PaymentState.submitted,
        })),
        send: mockBexioInvoiceSend,
        issue: mockBexioInvoiceIssue,
        showPdf: mockBexioInvoiceShowPdf,
        cancel: mockBexioInvoiceCancel,
      },
    };
  });

  return {
    __esModule: true,
    default: Bexio,
    ContactsStatic,
  };
});

const bexioSettings = {
  id: 'bexio',
  type: 'bexio',
  name: 'Bexio',
  offSessionPayments: false,
  apiKey: 'sampleApiKey',
  bexio_unitId: 6,
  bexio_invoiceTemplateNewMembership: 'template1',
  bexio_invoiceTemplateRenewalMembership: 'template2',
  bexio_userId: 22,
  bexio_taxId: 7,
  bexio_accountId: 8,
  bexio_countryId: 22,
  bexio_invoiceTitleNewMembership: 'Title1',
  bexio_invoiceTitleRenewalMembership: 'Title2',
  bexio_invoiceMailSubjectNewMembership: 'Subject1',
  bexio_invoiceMailBodyNewMembership: 'Body1',
  bexio_invoiceMailSubjectRenewalMembership: 'Subject2',
  bexio_invoiceMailBodyRenewalMembership: 'Body2',
  bexio_markInvoiceAsOpen: true,
};

const bexioPdf = {
  name: 'RE-1.pdf',
  size: 3,
  mime: 'application/pdf',
  content: Buffer.from('pdf'),
};

describe('BexioPaymentProvider', () => {
  let mockProps;
  let bexioPaymentProvider;
  let testing: NamespacedCacheTesting;

  beforeEach(async () => {
    testing = await createNamespacedCacheTesting();
    await testing.cache.setNs(
      'settings:paymentprovider',
      'bexio',
      bexioSettings,
      60
    );
    mockBexioInvoiceSend.mockResolvedValue({ success: true });
    mockBexioInvoiceIssue.mockResolvedValue({ success: true });
    mockBexioInvoiceShowPdf.mockResolvedValue(bexioPdf);
    mockProps = {
      id: 'bexio',
      prisma: {
        payment: {
          findFirst: mockFindFirst,
        },
        invoice: {
          findUnique: mockFindUnique,
        },
      } as any,
      kv: testing.cache,
      resets: testing.resets,
    };

    bexioPaymentProvider = new BexioPaymentProvider(mockProps);
  });

  afterEach(() => testing.close());

  describe('when Bexio refuses', () => {
    const unauthorized = { code: 401, message: { message: 'Unauthorized' } };

    it('says which step failed and why, instead of a bare object', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'inv-1',
        items: [],
        subscription: {
          user: { email: 'dev@wepublish.ch', paymentProviderCustomers: [] },
        },
      });
      mockBexioContactSearch.mockRejectedValueOnce(unauthorized);

      await expect(
        bexioPaymentProvider.bexioCreate('inv-1', true)
      ).rejects.toThrow(
        'Bexio failed while searching the contact for invoice inv-1: 401 Unauthorized'
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.any(String),
        'inv-1',
        true,
        'Bexio failed while searching the contact for invoice inv-1: 401 Unauthorized'
      );
    });

    it('also cancels invoices bexio already lists as unpaid', async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      const provider = new BexioPaymentProvider({
        ...mockProps,
        prisma: {
          invoice: { findFirst: vi.fn().mockResolvedValue({ id: 'inv-1' }) },
          payment: { findMany },
        },
      });

      await provider.cancelRemoteSubscription({
        subscription: { id: 'sub-1' },
      } as never);

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            state: {
              in: expect.arrayContaining([PaymentState.requiresUserAction]),
            },
          }),
        })
      );
    });

    it('logs which payment it could not cancel and why', async () => {
      const provider = new BexioPaymentProvider({
        ...mockProps,
        prisma: {
          invoice: { findFirst: vi.fn().mockResolvedValue({ id: 'inv-1' }) },
          payment: {
            findMany: vi
              .fn()
              .mockResolvedValue([{ id: 'pay-1', intentID: '42' }]),
          },
        },
      });
      mockBexioInvoiceCancel.mockRejectedValueOnce(unauthorized);

      await provider.cancelRemoteSubscription({
        subscription: { id: 'sub-1' },
      } as never);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error to cancel invoice for payment (id: %s): %s',
        'pay-1',
        '401 Unauthorized'
      );
    });
  });

  describe('Creating an invoice in Bexio', () => {
    const mockContact = {
      id: 123,
      name: 'Test Contact',
      mail: 'test@example.com',
    };
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        memberPlan: { name: 'Test Membership' },
        user: { email: 'test@example.com' },
        monthlyAmount: 100,
        paymentPeriodicity: 'monthly',
      },
      items: [
        {
          amount: 50,
          quantity: 1,
        },
        {
          amount: 25,
          quantity: 1,
        },
        {
          amount: 25,
          quantity: 1,
        },
      ],
    };

    it('creates the invoice and emails it with the pdf attached', async () => {
      const result = await bexioPaymentProvider.createInvoice(
        mockContact,
        mockInvoice,
        false
      );

      expect(result.invoice.id).toBe('testid');
      expect(result.deliveryError).toBeUndefined();
      expect(mockBexioInvoiceSend).toHaveBeenCalledWith(
        'testid',
        expect.objectContaining({
          recipient_email: 'test@example.com',
          attach_pdf: true,
          mark_as_open: true,
        })
      );
      expect(mockBexioInvoiceIssue).not.toHaveBeenCalled();
      expect(mockBexioInvoiceShowPdf).not.toHaveBeenCalled();
    });

    it('issues and renders the invoice instead of emailing it when the reader gets letters', async () => {
      const result = await bexioPaymentProvider.createInvoice(
        mockContact,
        mockInvoice,
        true,
        MailChannel.letter
      );

      expect(mockBexioInvoiceSend).not.toHaveBeenCalled();
      expect(mockBexioInvoiceIssue).toHaveBeenCalledWith('testid');
      expect(mockBexioInvoiceShowPdf).toHaveBeenCalledWith('testid', 1);
      expect(result.document).toEqual({
        content: Buffer.from('pdf'),
        name: 'RE-1.pdf',
        mime: 'application/pdf',
      });
      expect(result.deliveryError).toBeUndefined();
    });

    it('leaves a letter invoice a draft when invoices are not marked open', async () => {
      await testing.cache.setNs(
        'settings:paymentprovider',
        'bexio',
        { ...bexioSettings, bexio_markInvoiceAsOpen: false },
        60
      );

      await bexioPaymentProvider.createInvoice(
        mockContact,
        mockInvoice,
        true,
        MailChannel.letter
      );

      expect(mockBexioInvoiceIssue).not.toHaveBeenCalled();
      expect(mockBexioInvoiceShowPdf).toHaveBeenCalledWith('testid', 1);
    });

    // The invoice exists in bexio once `create` returned; throwing here would
    // make the next attempt create a second one.
    it('keeps the invoice when bexio could not email it', async () => {
      mockBexioInvoiceSend.mockResolvedValue({ success: false });

      const result = await bexioPaymentProvider.createInvoice(
        mockContact,
        mockInvoice,
        false
      );

      expect(result.invoice.id).toBe('testid');
      expect(result.deliveryError).toMatch(/Sending of the invoice failed/);
    });

    it('keeps the invoice when its pdf could not be fetched', async () => {
      mockBexioInvoiceShowPdf.mockRejectedValue({
        code: 500,
        message: 'boom',
      });

      const result = await bexioPaymentProvider.createInvoice(
        mockContact,
        mockInvoice,
        true,
        MailChannel.letter
      );

      expect(result.invoice.id).toBe('testid');
      expect(result.document).toBeUndefined();
      expect(result.deliveryError).toContain('boom');
    });
  });

  describe('creating a renewal invoice for the nightly job', () => {
    const props = {
      subscription: { id: 'sub-1' },
      invoice: { id: 'inv-1', items: [] },
    };

    beforeEach(() => {
      mockFindUnique.mockResolvedValue({
        id: 'inv-1',
        items: [{ amount: 50, quantity: 1 }],
        subscription: {
          user: {
            email: 'dev@wepublish.ch',
            name: 'name',
            firstName: 'firstName',
            paymentProviderCustomers: [],
          },
          memberPlan: { name: 'Plan Name' },
          monthlyAmount: 10,
          paymentPeriodicity: PaymentPeriodicity.yearly,
        },
      });
      mockBexioContactSearch.mockResolvedValue([{ nr: '123' }]);
      mockBexioContactEdit.mockResolvedValue({
        id: '123',
        mail: 'dev@wepublish.ch',
      });
    });

    it('hands back the bexio invoice as an intent, so the payment can be polled', async () => {
      const result = await bexioPaymentProvider.createRemoteInvoice(
        props as never
      );

      expect(result).toEqual({
        intent: expect.objectContaining({
          intentID: 'testid',
          state: PaymentState.submitted,
        }),
      });
      expect(mockBexioInvoiceSend).toHaveBeenCalledWith(
        'testid',
        expect.objectContaining({ subject: 'Subject2', message: 'Body2' })
      );
    });

    it('hands back the rendered pdf for a reader who gets letters', async () => {
      const result = await bexioPaymentProvider.createRemoteInvoice({
        ...props,
        channel: MailChannel.letter,
      } as never);

      expect(result?.intent.intentID).toBe('testid');
      expect(result?.document).toEqual({
        content: Buffer.from('pdf'),
        name: 'RE-1.pdf',
        mime: 'application/pdf',
      });
      expect(mockBexioInvoiceSend).not.toHaveBeenCalled();
    });

    it('reports a failed delivery with the intent instead of throwing', async () => {
      mockBexioInvoiceSend.mockResolvedValue({ success: false });

      const result = await bexioPaymentProvider.createRemoteInvoice(
        props as never
      );

      expect(result?.intent.intentID).toBe('testid');
      expect(result?.deliveryError).toMatch(/Sending of the invoice failed/);
    });

    it('renders the pdf of an invoice it created earlier, found by its payment', async () => {
      const document = await bexioPaymentProvider.renderRemoteInvoice({
        payment: { id: 'pay-1', intentID: '42' },
      } as never);

      expect(mockBexioInvoiceShowPdf).toHaveBeenCalledWith(42, 1);
      expect(document).toEqual({
        content: Buffer.from('pdf'),
        name: 'RE-1.pdf',
        mime: 'application/pdf',
      });
    });

    it('renders nothing for a payment that never reached bexio', async () => {
      await expect(
        bexioPaymentProvider.renderRemoteInvoice({
          payment: { id: 'pay-1', intentID: null },
        } as never)
      ).resolves.toBeUndefined();
      expect(mockBexioInvoiceShowPdf).not.toHaveBeenCalled();
    });

    it('still fails a checkout when bexio could not email the invoice', async () => {
      mockBexioInvoiceSend.mockResolvedValue({ success: false });

      await expect(
        bexioPaymentProvider.createIntent({
          invoice: { id: 'inv-1', subscriptionID: 'sub-1' },
          paymentID: 'pay-1',
          saveCustomer: false,
          currency: Currency.CHF,
        } as never)
      ).rejects.toThrow('Sending of the invoice failed');
    });
  });

  describe('Checking intent status', () => {
    it('should check intent status correctly and return the values from fetch', async () => {
      mockFindFirst.mockResolvedValue({
        id: '123',
      });

      const bexioPaymentProvider = new BexioPaymentProvider(mockProps);
      const res = await bexioPaymentProvider.checkIntentStatus({
        intentID: '123',
        paymentID: '123',
      });

      expect(res.state).toEqual('paid');
      expect(res.customerID).toEqual('321');
      expect(res.paymentID).toEqual('123');
    });
  });

  describe('Test intent creation', () => {
    it('should throw error if subscriptionId is null', async () => {
      const props: CreatePaymentIntentProps = {
        invoice: {
          description: '',
          paidAt: null,
          canceledAt: null,
          scheduledDeactivationAt: null,
          manuallySetAsPaidByUserId: null,
          renewalSuccessMailSentAt: null,
          suppressRenewalSuccessMail: false,
          subscriptionID: null,
          createdAt: new Date(),
          dueAt: new Date(),
          id: '123',
          items: [
            {
              amount: 50,
              quantity: 1,
            },
            {
              amount: 25,
              quantity: 1,
            },
            {
              amount: 25,
              quantity: 1,
            },
          ] as InvoiceItem[],
          mail: 'dev@wepublish.com',
          modifiedAt: new Date(),
          currency: Currency.EUR,
        },
        paymentID: '123',
        saveCustomer: true,
        currency: Currency.EUR,
      };
      await expect(async () => {
        const bexioPaymentProvider = new BexioPaymentProvider(mockProps);
        await bexioPaymentProvider.createIntent(props);
      }).rejects.toThrow(
        'No subscriptionID associated with the provided invoice'
      );
    });
  });
  it('should throw error if invoice is not found', async () => {
    mockFindUnique.mockResolvedValue({
      id: '123',
    });
    const props: CreatePaymentIntentProps = {
      invoice: {
        description: '',
        paidAt: null,
        canceledAt: null,
        scheduledDeactivationAt: null,
        manuallySetAsPaidByUserId: null,
        renewalSuccessMailSentAt: null,
        suppressRenewalSuccessMail: false,
        subscriptionID: '123',
        createdAt: new Date(),
        dueAt: new Date(),
        id: '123',
        items: [
          {
            amount: 50,
            quantity: 1,
          },
          {
            amount: 25,
            quantity: 1,
          },
          {
            amount: 25,
            quantity: 1,
          },
        ] as InvoiceItem[],
        mail: 'dev@wepublish.com',
        modifiedAt: new Date(),
        currency: Currency.CHF,
      },
      paymentID: '123',
      saveCustomer: true,
      currency: Currency.CHF,
    };
    await expect(async () => {
      const bexioPaymentProvider = new BexioPaymentProvider(mockProps);
      await bexioPaymentProvider.createIntent(props);
    }).rejects.toThrow(
      `Bexio payment adapter didn't find the invoice, subscription or user! {"id":"123"}`
    );
  });
  it('should create new contact and new invoice', async () => {
    mockFindUnique.mockResolvedValue({
      items: [
        {
          amount: 50,
          quantity: 1,
        },
        {
          amount: 25,
          quantity: 1,
        },
        {
          amount: 25,
          quantity: 1,
        },
      ] as InvoiceItem[],
      subscription: {
        user: {
          email: 'dev@wepublish.ch',
          name: 'name',
          firstName: 'firstName',
          paymentProviderCustomers: [],
        },
        memberPlan: {
          name: 'Plan Name',
        },
        monthlyAmount: 10,
        paymentPeriodicity: PaymentPeriodicity.yearly,
      },
    });

    mockBexioContactSearch.mockResolvedValue([]);
    mockBexioContactCreate.mockResolvedValue({
      id: '123',
      mail: 'dev@wepublish.ch',
    });

    const props: CreatePaymentIntentProps = {
      invoice: {
        description: '',
        paidAt: null,
        canceledAt: null,
        scheduledDeactivationAt: null,
        manuallySetAsPaidByUserId: null,
        renewalSuccessMailSentAt: null,
        suppressRenewalSuccessMail: false,
        subscriptionID: '123',
        createdAt: new Date(),
        dueAt: new Date(),
        id: '123',
        items: [
          {
            amount: 50,
            quantity: 1,
          },
          {
            amount: 25,
            quantity: 1,
          },
          {
            amount: 25,
            quantity: 1,
          },
        ] as InvoiceItem[],
        mail: 'dev@wepublish.com',
        modifiedAt: new Date(),
        currency: Currency.CHF,
      },
      paymentID: '123',
      saveCustomer: true,
      currency: Currency.EUR,
    };
    const bexioPaymentProvider = new BexioPaymentProvider(mockProps);
    await bexioPaymentProvider.createIntent(props);
  });

  it('should create new invoice for existing contact', async () => {
    mockFindUnique.mockResolvedValue({
      items: [
        {
          amount: 50,
          quantity: 1,
        },
        {
          amount: 25,
          quantity: 1,
        },
        {
          amount: 25,
          quantity: 1,
        },
      ] as InvoiceItem[],
      subscription: {
        user: {
          email: 'dev@wepublish.ch',
          name: 'name',
          firstName: 'firstName',
          paymentProviderCustomers: [],
        },
        memberPlan: {
          name: 'Plan Name',
        },
        monthlyAmount: 10,
        paymentPeriodicity: PaymentPeriodicity.yearly,
      },
    });

    mockBexioContactSearch.mockResolvedValue([
      {
        nr: '123',
      },
    ]);

    mockBexioContactEdit.mockResolvedValue({
      id: '123',
      mail: 'dev@wepublish.ch',
    });

    const props: CreatePaymentIntentProps = {
      invoice: {
        description: '',
        paidAt: null,
        canceledAt: null,
        scheduledDeactivationAt: null,
        manuallySetAsPaidByUserId: null,
        renewalSuccessMailSentAt: null,
        suppressRenewalSuccessMail: false,
        subscriptionID: '123',
        createdAt: new Date(),
        dueAt: new Date(),
        id: '123',
        items: [
          {
            amount: 50,
            quantity: 1,
          },
          {
            amount: 25,
            quantity: 1,
          },
          {
            amount: 25,
            quantity: 1,
          },
        ] as InvoiceItem[],
        mail: 'dev@wepublish.com',
        modifiedAt: new Date(),
        currency: Currency.CHF,
      },
      paymentID: '123',
      saveCustomer: true,
      currency: Currency.CHF,
    };
    const bexioPaymentProvider = new BexioPaymentProvider(mockProps);
    const res = await bexioPaymentProvider.createIntent(props);
    expect(res.intentID).toEqual('testid');
    expect(res.intentSecret).toEqual('');
    expect(res.state).toEqual(PaymentState.submitted);
  });

  describe('syncing a contact', () => {
    const address = {
      company: null,
      streetAddress: 'Musterstrasse',
      streetAddressNumber: '7',
      streetAddress2: null,
      streetAddress2Number: null,
      zipCode: '8000',
      city: 'Zürich',
      country: 'Schweiz',
    };
    const reader = (overrides: Record<string, unknown> = {}) =>
      ({
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Doe',
        firstName: 'Jane',
        address,
        paymentProviderCustomers: [],
        ...overrides,
      }) as any;
    const known = reader({
      paymentProviderCustomers: [
        { paymentProviderID: 'bexio', customerID: '542' },
      ],
    });
    let provider: BexioPaymentProvider;
    let updateMany: ReturnType<typeof vi.fn>;
    let saveCustomer: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      updateMany = vi.fn();
      provider = new BexioPaymentProvider({
        ...mockProps,
        prisma: {
          ...mockProps.prisma,
          paymentProviderCustomer: { updateMany },
        },
      });
      vi.spyOn(provider, 'countries').mockResolvedValue(
        BexioCountries.of([{ id: 5, name: 'Schweiz', name_short: 'CH' }], 22)
      );
      saveCustomer = vi
        .spyOn(provider, 'saveCustomer')
        .mockResolvedValue(undefined);
      mockBexioContactEdit.mockReset().mockImplementation(async id => ({
        id,
      }));
      mockBexioContactSearch.mockReset();
      mockBexioContactCreate.mockReset();
    });

    it('edits the stored contact with the mapped fields only', async () => {
      await expect(provider.syncContact(known)).resolves.toBe('edited');

      expect(mockBexioContactEdit).toHaveBeenCalledWith(542, {
        name_1: 'Doe',
        name_2: 'Jane',
        contact_type_id: 2,
        mail: 'jane@example.com',
        street_name: 'Musterstrasse',
        house_number: '7',
        address_addition: '',
        postcode: '8000',
        city: 'Zürich',
        country_id: 5,
      });
      expect(mockBexioContactSearch).not.toHaveBeenCalled();
      expect(saveCustomer).not.toHaveBeenCalled();
      expect(updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', paymentProviderID: 'bexio' },
        data: { syncedAt: expect.any(Date) },
      });
    });

    it('finds a reader without a stored contact by email and remembers it', async () => {
      mockBexioContactSearch.mockResolvedValue([{ id: 7, nr: '1007' }]);

      await expect(provider.syncContact(reader())).resolves.toBe('edited');

      expect(mockBexioContactEdit).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ mail: 'jane@example.com' })
      );
      expect(saveCustomer).toHaveBeenCalledWith('user-1', '7');
      expect(updateMany).toHaveBeenCalled();
    });

    it('creates the contact when bexio has none for the reader', async () => {
      mockBexioContactSearch.mockResolvedValue([]);
      mockBexioContactCreate.mockResolvedValue({ id: 9 });

      await expect(provider.syncContact(reader())).resolves.toBe('created');

      expect(mockBexioContactCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name_1: 'Doe', user_id: 22, owner_id: 22 })
      );
      expect(saveCustomer).toHaveBeenCalledWith('user-1', '9');
    });

    // A stored id bexio no longer knows is a data problem to look at, not a
    // reason to create a second contact.
    it('skips a stored contact bexio no longer knows', async () => {
      mockBexioContactEdit.mockRejectedValue({
        code: 404,
        message: 'Not Found',
      });

      await expect(provider.syncContact(known)).resolves.toBe('missing');

      expect(mockBexioContactCreate).not.toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
    });
  });

  // The email can differ between we.publish and bexio (a placeholder from an
  // import, a reader who changed it), so the contact an invoice went to is
  // remembered and found by its id first.
  describe('finding the bexio contact', () => {
    const invoiceFor = (user: Record<string, unknown>) => ({
      items: [{ amount: 100, quantity: 1 }] as InvoiceItem[],
      subscription: {
        user: {
          id: 'user-1',
          email: 'nw-11993@placeholder.neuewege.ch',
          name: 'name',
          firstName: 'firstName',
          paymentProviderCustomers: [],
          ...user,
        },
        memberPlan: { name: 'Plan Name' },
        monthlyAmount: 10,
        paymentPeriodicity: PaymentPeriodicity.yearly,
      },
    });

    const createIntent = async (user: Record<string, unknown> = {}) => {
      mockFindUnique.mockResolvedValue(invoiceFor(user));
      const provider = new BexioPaymentProvider(mockProps);
      const saveCustomer = vi
        .spyOn(provider, 'saveCustomer')
        .mockResolvedValue(undefined);

      await provider.createIntent({
        invoice: {
          id: 'invoice-1',
          subscriptionID: 'subscription-1',
          items: [{ amount: 100, quantity: 1 }] as InvoiceItem[],
          currency: Currency.CHF,
        } as CreatePaymentIntentProps['invoice'],
        paymentID: 'payment-1',
        saveCustomer: false,
        currency: Currency.CHF,
      });

      return { saveCustomer };
    };

    beforeEach(() => {
      mockBexioContactShow.mockReset();
      mockBexioContactSearch.mockReset();
      mockBexioContactCreate.mockReset();
      mockBexioContactEdit.mockReset().mockImplementation(async id => ({
        id,
      }));
    });

    it('leaves the contact groups and the rest of the contact alone', async () => {
      mockBexioContactShow.mockResolvedValue({ id: 542, nr: '1042' });

      await createIntent({
        paymentProviderCustomers: [
          { paymentProviderID: 'bexio', customerID: '542' },
        ],
      });

      const [, fields] = mockBexioContactEdit.mock.calls[0];
      expect(fields).not.toHaveProperty('contact_group_ids');
      expect(fields).not.toHaveProperty('owner_id');
    });

    it('uses the contact stored for the reader instead of searching by email', async () => {
      mockBexioContactShow.mockResolvedValue({ id: 542, nr: '1042' });

      const { saveCustomer } = await createIntent({
        paymentProviderCustomers: [
          { paymentProviderID: 'bexio', customerID: '542' },
        ],
      });

      expect(mockBexioContactShow).toHaveBeenCalledWith(542);
      expect(mockBexioContactSearch).not.toHaveBeenCalled();
      expect(mockBexioContactEdit).toHaveBeenCalledWith(
        542,
        expect.objectContaining({ nr: '1042' })
      );
      expect(saveCustomer).not.toHaveBeenCalled();
    });

    it('ignores contacts stored for another payment provider', async () => {
      mockBexioContactSearch.mockResolvedValue([{ id: 7, nr: '1007' }]);

      await createIntent({
        paymentProviderCustomers: [
          { paymentProviderID: 'payrexx', customerID: '542' },
        ],
      });

      expect(mockBexioContactShow).not.toHaveBeenCalled();
      expect(mockBexioContactEdit).toHaveBeenCalledWith(7, expect.anything());
    });

    it('searches by email when the stored contact is gone', async () => {
      mockBexioContactShow.mockRejectedValue(new Error('404 Not Found'));
      mockBexioContactSearch.mockResolvedValue([{ id: 7, nr: '1007' }]);

      const { saveCustomer } = await createIntent({
        paymentProviderCustomers: [
          { paymentProviderID: 'bexio', customerID: '542' },
        ],
      });

      expect(mockBexioContactEdit).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ nr: '1007' })
      );
      expect(saveCustomer).toHaveBeenCalledWith('user-1', '7');
    });

    it('remembers the contact it found by email for the next invoice', async () => {
      mockBexioContactSearch.mockResolvedValue([{ id: 7, nr: '1007' }]);

      const { saveCustomer } = await createIntent();

      expect(saveCustomer).toHaveBeenCalledWith('user-1', '7');
    });

    it('still creates the invoice when the contact cannot be remembered', async () => {
      mockBexioContactSearch.mockResolvedValue([{ id: 7, nr: '1007' }]);
      mockFindUnique.mockResolvedValue(invoiceFor({}));
      const provider = new BexioPaymentProvider(mockProps);
      vi.spyOn(provider, 'saveCustomer').mockRejectedValue(
        new Error('database down')
      );

      const { intent } = await provider.bexioCreate('invoice-1', true);

      expect(intent.intentID).toBe('testid');
    });

    // a missing id must not end up stored as the text "null" or "undefined"
    it.each([null, undefined])(
      'does not remember a contact whose id is %s',
      async id => {
        mockBexioContactSearch.mockResolvedValue([]);
        mockBexioContactCreate.mockResolvedValue({ id });

        const { saveCustomer } = await createIntent();

        expect(saveCustomer).not.toHaveBeenCalled();
      }
    );

    it('remembers a contact it had to create', async () => {
      mockBexioContactSearch.mockResolvedValue([]);
      mockBexioContactCreate.mockResolvedValue({ id: 900 });

      const { saveCustomer } = await createIntent();

      expect(saveCustomer).toHaveBeenCalledWith('user-1', '900');
    });
  });
});
