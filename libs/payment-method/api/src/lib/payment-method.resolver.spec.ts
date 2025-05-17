import {INestApplication} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {PrismaClient} from '@prisma/client'
import request from 'supertest'
import {expect} from '@storybook/jest'
import {PaymentMethodService} from './payment-method.service'
import {PaymentMethodResolver} from './payment-method.resolver'
import {PaymentMethodDataloader} from './payment-method.dataloader'

const paymentMethodQueryById = `
  query GetPaymentMethodById($id: ID!) {
    getPaymentMethodById(id: $id) {
      id
      createdAt
      modifiedAt
      name
      slug
      description
      paymentProviderID
      active
    }
  }
`

const paymentMethodsListQuery = `
  query GetPaymentMethods {
    getPaymentMethods {
      id
      createdAt
      modifiedAt
      name
      slug
      description
      paymentProviderID
      active
    }
  }
`

const createPaymentMethodMutation = `
  mutation CreatePaymentMethod($paymentMethod: CreatePaymentMethodInput!) {
    createPaymentMethod(paymentMethod: $paymentMethod) {
      id
      createdAt
      modifiedAt
      name
      slug
      description
      paymentProviderID
      active
    }
  }
`

const updatePaymentMethodMutation = `
  mutation UpdatePaymentMethod($paymentMethod: UpdatePaymentMethodInput!) {
    updatePaymentMethod(paymentMethod: $paymentMethod) {
      id
      createdAt
      modifiedAt
      name
      slug
      description
      paymentProviderID
      active
    }
  }
`

const deletePaymentMethodMutation = `
  mutation DeletePaymentMethod($id: ID!) {
    deletePaymentMethodById(id: $id) {
      id
    }
  }
`

describe('PaymentMethodResolver', () => {
  let app: INestApplication
  let paymentMethodServiceMock: {[method in keyof PaymentMethodService]?: jest.Mock}
  let paymentMethodDataloaderMock: {[method in keyof PaymentMethodDataloader]?: jest.Mock}

  beforeEach(async () => {
    paymentMethodServiceMock = {
      getPaymentMethods: jest.fn(),
      createPaymentMethod: jest.fn(),
      deletePaymentMethodById: jest.fn(),
      updatePaymentMethod: jest.fn()
    }

    paymentMethodDataloaderMock = {
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
        PaymentMethodResolver,
        {provide: PaymentMethodDataloader, useValue: paymentMethodDataloaderMock},
        {provide: PaymentMethodService, useValue: paymentMethodServiceMock},
        {provide: PrismaClient, useValue: jest.fn()}
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('Query: getPaymentMethod by id', async () => {
    const mockResponse = {
      id: '1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-01T00:00:00Z'),
      name: 'Credit Card',
      slug: 'credit-card',
      description: 'A standard credit card payment method',
      paymentProviderID: 'provider-1',
      active: true
    }
    paymentMethodDataloaderMock.load?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: paymentMethodQueryById,
        variables: {id: '1'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getPaymentMethod by id: Not found', async () => {
    paymentMethodDataloaderMock.load?.mockResolvedValue(null)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: paymentMethodQueryById,
        variables: {id: 'not-found'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getPaymentMethods list', async () => {
    const mockResponse = [
      {
        id: '1',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        modifiedAt: new Date('2023-01-01T00:00:00Z'),
        name: 'Credit Card',
        slug: 'credit-card',
        description: 'A standard credit card payment method',
        paymentProviderID: 'provider-1',
        active: true
      },
      {
        id: '2',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        modifiedAt: new Date('2023-01-01T00:00:00Z'),
        name: 'PayPal',
        slug: 'paypal',
        description: 'A PayPal payment method',
        paymentProviderID: 'provider-2',
        active: true
      }
    ]
    paymentMethodServiceMock.getPaymentMethods?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: paymentMethodsListQuery
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Mutation: createPaymentMethod', async () => {
    const paymentMethod = {
      name: 'New Payment Method',
      slug: 'new-payment-method',
      description: 'Description of new payment method',
      paymentProviderID: 'provider-3',
      active: true
    }
    const mockResponse = {
      id: '3',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-01T00:00:00Z'),
      name: 'New Payment Method',
      slug: 'new-payment-method',
      description: 'Description of new payment method',
      paymentProviderID: 'provider-3',
      active: true
    }
    paymentMethodServiceMock.createPaymentMethod?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createPaymentMethodMutation,
        variables: {paymentMethod}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(paymentMethodServiceMock.createPaymentMethod).toHaveBeenCalledWith(paymentMethod)
      })
      .expect(200)
  })

  test('Mutation: updatePaymentMethod', async () => {
    const paymentMethod = {
      id: '1',
      name: 'Updated Payment Method',
      slug: 'updated-payment-method',
      description: 'Updated description',
      paymentProviderID: 'provider-1',
      active: true
    }
    const mockResponse = {
      id: '1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-01T00:00:00Z'),
      name: 'Updated Payment Method',
      slug: 'updated-payment-method',
      description: 'Updated description',
      paymentProviderID: 'provider-1',
      active: true
    }
    paymentMethodServiceMock.updatePaymentMethod?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updatePaymentMethodMutation,
        variables: {paymentMethod}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(paymentMethodServiceMock.updatePaymentMethod).toHaveBeenCalledWith(paymentMethod)
      })
      .expect(200)
  })

  test('Mutation: deletePaymentMethod', async () => {
    const mockId = '1'
    const mockResponse = {id: '1'}
    paymentMethodServiceMock.deletePaymentMethodById?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deletePaymentMethodMutation,
        variables: {id: mockId}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(paymentMethodServiceMock.deletePaymentMethodById).toHaveBeenCalledWith(mockId)
      })
      .expect(200)
  })
})
