import {INestApplication} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {PrismaClient} from '@prisma/client'
import request from 'supertest'
import {expect} from '@storybook/jest'
import {PaymentService} from './payment.service'
import {PaymentResolver} from './payment.resolver'
import {PaymentDataloader} from './payment.dataloader'

const paymentQueryById = `
    query GetPaymentById($id: ID!) {
        getPaymentById(id: $id) {
            id
            createdAt
            modifiedAt
            intentID
            intentSecret
            intentData
            paymentData
            state
            invoiceID
            paymentMethodID
        }
    }
`

const paymentsListQuery = `
    query getPayments($skip: Int, $take: Int, $filter: PaymentFilter, $sort: PaymentSort) {
        getPayments(skip: $skip, take: $take, filter: $filter, sort: $sort) {
            nodes {
                id
                createdAt
                modifiedAt
                intentID
                intentSecret
                intentData
                paymentData
                state
                invoiceID
                paymentMethodID
            }
            totalCount
        }
    }
`

const createPaymentFromInvoiceMutation = `
    mutation CreatePaymentFromInvoice($input: PaymentFromInvoiceInput!) {
        createPaymentFromInvoice(input: $input) {
            id
            createdAt
            modifiedAt
            intentID
            intentSecret
            intentData
            paymentData
            state
            invoiceID
            paymentMethodID
        }
    }
`

describe('PaymentResolver', () => {
  let app: INestApplication
  let paymentsServiceMock: {[method in keyof PaymentService]?: jest.Mock}
  let paymentDataloaderMock: {[method in keyof PaymentDataloader]?: jest.Mock}

  beforeEach(async () => {
    paymentsServiceMock = {
      getPayments: jest.fn(),
      createPaymentFromInvoice: jest.fn()
    }

    paymentDataloaderMock = {
      load: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/'
        })
      ],
      providers: [
        PaymentResolver,
        {provide: PaymentDataloader, useValue: paymentDataloaderMock},
        {provide: PaymentService, useValue: paymentsServiceMock},
        {provide: PrismaClient, useValue: jest.fn()}
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('Query: getPayment by id', async () => {
    const mockResponse = {
      id: '1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-01T00:00:00Z'),
      intentID: 'intent-1',
      intentSecret: 'secret-1',
      intentData: 'data-1',
      paymentData: 'payment-data-1',
      state: 'created',
      invoiceID: 'invoice-1',
      paymentMethodID: 'method-1'
    }
    paymentDataloaderMock.load?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: paymentQueryById,
        variables: {id: '1'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getPayment by id: Not found', async () => {
    paymentDataloaderMock.load?.mockResolvedValue(null)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: paymentQueryById,
        variables: {id: 'not-found'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getPayments list', async () => {
    const mockResponse = {
      nodes: [
        {
          id: '1',
          createdAt: new Date('2023-01-01T00:00:00Z'),
          modifiedAt: new Date('2023-01-01T00:00:00Z'),
          intentID: 'intent-1',
          intentSecret: 'secret-1',
          intentData: 'data-1',
          paymentData: 'payment-data-1',
          state: 'created',
          invoiceID: 'invoice-1',
          paymentMethodID: 'method-1'
        }
      ],
      totalCount: 1
    }
    paymentsServiceMock.getPayments?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: paymentsListQuery,
        variables: {take: 10, skip: 0}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Mutation: createPaymentFromInvoice', async () => {
    const paymentInput = {
      invoiceID: 'invoice-1',
      paymentMethodID: 'method-1',
      successURL: 'http://success.url',
      failureURL: 'http://failure.url'
    }
    const mockResponse = {
      id: '1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-01T00:00:00Z'),
      intentID: 'intent-1',
      intentSecret: 'secret-1',
      intentData: 'data-1',
      paymentData: 'payment-data-1',
      state: 'created',
      invoiceID: 'invoice-1',
      paymentMethodID: 'method-1'
    }
    paymentsServiceMock.createPaymentFromInvoice?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createPaymentFromInvoiceMutation,
        variables: {input: paymentInput}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(paymentsServiceMock.createPaymentFromInvoice).toHaveBeenCalledWith(paymentInput)
      })
      .expect(200)
  })
})
