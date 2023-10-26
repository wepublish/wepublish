import {BexioPaymentProvider} from '../bexioPaymentProvider'
import {PaymentState, PrismaClient} from '@prisma/client'
import fetch from 'jest-fetch-mock'

jest.setMock('node-fetch', fetch)
jest.mock('axios')
jest.mock('@prisma/client')

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
        create: jest.fn()
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
      // const bexioPaymentProvider = new BexioPaymentProvider(mockProps)

      expect(bexioPaymentProvider).toHaveProperty('apiKey', 'sampleApiKey')
      expect(bexioPaymentProvider).toHaveProperty('userId', 123)
      // Continue for all other properties
    })
  })

  describe('Creating an invoice in Bexio', () => {
    it('should create an invoice in Bexio', async () => {
      // Mock necessary dependencies
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

      const bexioCreateSpy = jest.spyOn(bexioPaymentProvider, 'bexioCreate').mockResolvedValue({
        intentID: '12345',
        intentSecret: '',
        intentData: JSON.stringify({}),
        state: PaymentState.submitted
      })

      // Call the createInvoice function
      const result = await bexioPaymentProvider.createInvoice(mockContact, mockInvoice, false)

      // Assertions
      expect(bexioCreateSpy).toHaveBeenCalledWith('invoice-1', false)
      expect(result.intentID).toBe('12345')
      expect(result.state).toBe(PaymentState.submitted)
    })
  })

  describe('Checking intent status', () => {
    it('should check intent status correctly', async () => {
      // Setup the mock Bexio function that's being called to check intent status
      const checkIntentMock = jest.fn().mockResolvedValue('mocked status data')

      const bexioPaymentProvider = new BexioPaymentProvider(mockProps)
      const status = await bexioPaymentProvider.checkIntentStatus({intentID: '123'}) // Replace with the correct method name if necessary

      expect(checkIntentMock).toHaveBeenCalled()
      expect(status).toEqual('mocked status data')
    })
  })
})
