import { BexioPaymentProvider } from './bexio-payment-provider';
import {
  Currency,
  PaymentPeriodicity,
  PaymentState,
  PrismaClient,
} from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { CreatePaymentIntentProps } from '@wepublish/payment/api';

jest.mock('axios');

const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  return {
    __esModule: true,
    ...originalModule,
    PrismaClient: jest.fn().mockImplementation(() => ({
      payment: {
        findFirst: mockFindFirst,
      },
      invoice: {
        findUnique: mockFindUnique,
      },
    })),
  };
});

jest.mock('node-fetch', () =>
  jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          kb_item_status_id: 9,
          payment_type_id: 123,
          contact_id: 321,
        }),
      status: 200,
    })
  )
);

const mockBexioContactSearch = jest.fn();
const mockBexioContactCreate = jest.fn();
const mockBexioContactEdit = jest.fn();

jest.mock('bexio', () => {
  const ContactsStatic = {
    ContactSearchParameters: {
      mail: 'mockMailParameter',
    },
  };

  const Bexio = jest.fn().mockImplementation(() => {
    return {
      contacts: {
        search: mockBexioContactSearch,
        create: mockBexioContactCreate,
        edit: mockBexioContactEdit,
      },
      invoices: {
        create: jest.fn().mockImplementation(() => ({
          id: 'testid',
          intentID: '12345',
          state: PaymentState.submitted,
        })),
        sent: jest.fn().mockImplementation(() => ({
          success: true,
        })),
      },
    };
  });

  return {
    __esModule: true,
    default: Bexio,
    ContactsStatic,
  };
});

describe('BexioPaymentProvider', () => {
  let mockProps;
  let bexioPaymentProvider;
  let kvMock;

  beforeEach(async () => {
    kvMock = createKvMock();
    await kvMock.setNs(
      'settings:paymentprovider',
      'bexio',
      JSON.stringify({
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
      })
    );
    mockProps = {
      id: 'bexio',
      prisma: new PrismaClient(),
      kv: kvMock,
    };

    bexioPaymentProvider = new BexioPaymentProvider(mockProps);
  });

  describe('Creating an invoice in Bexio', () => {
    it('should call invoices and sent bexio methods', async () => {
      const mockContact = { id: 123, name: 'Test Contact' };
      const mockInvoice = {
        id: 'invoice-1',
        subscription: {
          memberPlan: { name: 'Test Membership' },
          user: { email: 'test@example.com' },
          monthlyAmount: 100,
          paymentPeriodicity: 'monthly',
        },
      };

      const result = await bexioPaymentProvider.createInvoice(
        mockContact,
        mockInvoice,
        false
      );

      expect(result.intentID).toBe('12345');
      expect(result.state).toBe(PaymentState.submitted);
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
          subscriptionID: null,
          createdAt: new Date(),
          dueAt: new Date(),
          id: '123',
          items: [],
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
        subscriptionID: '123',
        createdAt: new Date(),
        dueAt: new Date(),
        id: '123',
        items: [],
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
      subscription: {
        user: {
          email: 'dev@wepublish.ch',
          name: 'name',
          firstName: 'firstName',
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
        subscriptionID: '123',
        createdAt: new Date(),
        dueAt: new Date(),
        id: '123',
        items: [],
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
      subscription: {
        user: {
          email: 'dev@wepublish.ch',
          name: 'name',
          firstName: 'firstName',
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
        subscriptionID: '123',
        createdAt: new Date(),
        dueAt: new Date(),
        id: '123',
        items: [],
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
});
