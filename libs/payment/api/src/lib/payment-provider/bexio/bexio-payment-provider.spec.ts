import {BexioPaymentProvider} from './bexio-payment-provider'
import {PaymentState, PrismaClient} from '@prisma/client'

jest.mock('axios')

const mockFindFirst = jest.fn()
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client')
  return {
    __esModule: true,
    ...originalModule,
    PrismaClient: jest.fn().mockImplementation(() => ({
      payment: {
        findFirst: mockFindFirst
      }
    }))
  }
})

jest.mock('node-fetch', () =>
  jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({kb_item_status_id: 9, payment_type_id: 123, contact_id: 321}),
      status: 200
    })
  )
)

jest.mock('bexio', () => {
  const ContactsStatic = {
    ContactSearchParameters: {
      mail: 'mockMailParameter'
    }
  }

  const Bexio = jest.fn().mockImplementation(() => {
    return {
      contacts: {
        search: jest.fn()
      },
      invoices: {
        create: jest.fn().mockImplementation(() => ({
          id: 'testid',
          intentID: '12345',
          state: PaymentState.submitted
        })),
        sent: jest.fn().mockImplementation(() => ({
          success: true
        }))
      }
    }
  })

  return {
    __esModule: true,
    default: Bexio,
    ContactsStatic
  }
})

describe('BexioPaymentProvider', () => {
  let mockProps
  let bexioPaymentProvider

  beforeEach(() => {
    mockProps = {
      apiKey: 'sampleApiKey',
      userId: 123,
      countryId: 45,
      invoiceTemplateNewMembership: 'template1',
      invoiceTemplateRenewalMembership: 'template2',
      unitId: 6,
      taxId: 7,
      accountId: 8,
      invoiceTitleNewMembership: 'Title1',
      invoiceTitleRenewalMembership: 'Title2',
      invoiceMailSubjectNewMembership: 'Subject1',
      invoiceMailBodyNewMembership: 'Body1',
      invoiceMailSubjectRenewalMembership: 'Subject2',
      invoiceMailBodyRenewalMembership: 'Body2',
      markInvoiceAsOpen: true,
      prisma: new PrismaClient()
    }
    bexioPaymentProvider = new BexioPaymentProvider(mockProps)
  })

  describe('Initialization', () => {
    it('should properly initialize properties', () => {
      expect(bexioPaymentProvider).toHaveProperty('apiKey', 'sampleApiKey')
      expect(bexioPaymentProvider).toHaveProperty('userId', 123)
    })
  })

  describe('Creating an invoice in Bexio', () => {
    it('should call invoices and sent bexio methods', async () => {
      const mockContact = {id: 123, name: 'Test Contact'}
      const mockInvoice = {
        id: 'invoice-1',
        subscription: {
          memberPlan: {name: 'Test Membership'},
          user: {email: 'test@example.com'},
          monthlyAmount: 100,
          paymentPeriodicity: 'monthly'
        }
      }

      const result = await bexioPaymentProvider.createInvoice(mockContact, mockInvoice, false)

      expect(result.intentID).toBe('12345')
      expect(result.state).toBe(PaymentState.submitted)
    })
  })

  describe('Checking intent status', () => {
    it('should check intent status correctly and return the values from fetch', async () => {
      mockFindFirst.mockResolvedValue({
        id: '123'
      })

      const bexioPaymentProvider = new BexioPaymentProvider(mockProps)
      const res = await bexioPaymentProvider.checkIntentStatus({intentID: '123'})

      expect(res.state).toEqual('paid')
      expect(res.customerID).toEqual('321')
      expect(res.paymentID).toEqual('123')
    })
  })
})
