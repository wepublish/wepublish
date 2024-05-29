import {Test, TestingModule} from '@nestjs/testing'
import {PaymentService} from './payment.service'
import {PaymentState, PrismaClient} from '@prisma/client'
import {PaymentMethodDataloader} from '@wepublish/payment-method/api'
import {PaymentProviderService} from './payment-provider.service'
import {GetPaymentsArgs, PaymentFromInvoiceInput, PaymentSort} from './payment.model'
import {SortOrder} from '@wepublish/utils/api'
import {PaymentDataloader} from './payment.dataloader'

describe('PaymentsService', () => {
  let service: PaymentService
  let prismaMock: any
  let paymentProvidersMock: any
  let paymentMethodsMock: any
  let paymentDataloaderMock: any

  beforeEach(async () => {
    prismaMock = {
      payment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      invoice: {
        findUnique: jest.fn()
      }
    }

    paymentProvidersMock = {
      findById: jest.fn()
    }

    paymentMethodsMock = {
      load: jest.fn()
    }

    paymentDataloaderMock = {
      prime: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {provide: PrismaClient, useValue: prismaMock},
        {provide: PaymentProviderService, useValue: paymentProvidersMock},
        {provide: PaymentMethodDataloader, useValue: paymentMethodsMock},
        {provide: PaymentDataloader, useValue: paymentDataloaderMock}
      ]
    }).compile()

    service = module.get<PaymentService>(PaymentService)
  })

  it('should get a payment by ID', async () => {
    prismaMock.payment.findUnique.mockResolvedValueOnce({id: '1'})
    await service.getPaymentById('1')
    expect(prismaMock.payment.findUnique).toHaveBeenCalled()
    expect(prismaMock.payment.findUnique.mock.calls[0]).toMatchSnapshot()
  })

  it('should get payments with filters', async () => {
    prismaMock.payment.findMany.mockResolvedValueOnce([{id: '1'}, {id: '2'}])
    prismaMock.payment.count.mockResolvedValueOnce(2)
    const args: GetPaymentsArgs = {
      filter: {intentID: 'intent1'},
      order: SortOrder.Ascending,
      sort: PaymentSort.CreatedAt,
      skip: 0,
      take: 2
    }
    await service.getPayments(args)
    expect(prismaMock.payment.findMany).toHaveBeenCalled()
    expect(prismaMock.payment.count).toHaveBeenCalled()
    expect(prismaMock.payment.findMany.mock.calls[0]).toMatchSnapshot()
  })

  it('should create a payment from invoice', async () => {
    const data: PaymentFromInvoiceInput = {
      paymentMethodID: 'pm1',
      invoiceID: 'inv1',
      failureURL: 'http://failure.url',
      successURL: 'http://success.url'
    }

    paymentMethodsMock.load.mockResolvedValueOnce({paymentProviderID: 'pp1'})
    paymentProvidersMock.findById.mockResolvedValueOnce({
      createIntent: jest.fn().mockResolvedValueOnce({
        state: PaymentState.created,
        intentID: 'intent1',
        intentData: 'intentData',
        intentSecret: 'intentSecret',
        paymentData: 'paymentData'
      })
    })

    prismaMock.invoice.findUnique.mockResolvedValueOnce({id: 'inv1', items: []})
    prismaMock.payment.create.mockResolvedValueOnce({id: '1', state: PaymentState.created})
    prismaMock.payment.update.mockResolvedValueOnce({id: '1', state: PaymentState.created})

    await service.createPaymentFromInvoice(data)
    expect(prismaMock.payment.create).toHaveBeenCalled()
    expect(prismaMock.payment.update).toHaveBeenCalled()
    expect(prismaMock.payment.create.mock.calls[0]).toMatchSnapshot()
    expect(prismaMock.payment.update.mock.calls[0]).toMatchSnapshot()
  })

  it('should find payment provider by payment method ID', async () => {
    paymentMethodsMock.load.mockResolvedValueOnce({paymentProviderID: 'pp1'})
    paymentProvidersMock.findById.mockResolvedValueOnce({id: 'pp1'})
    await service.findPaymentProviderByPaymentMethodId('pm1')
    expect(paymentMethodsMock.load).toHaveBeenCalled()
    expect(paymentProvidersMock.findById).toHaveBeenCalled()
    expect(paymentMethodsMock.load.mock.calls[0]).toMatchSnapshot()
  })
})
