import {PrismaClient} from '@prisma/client'
import {DynamicModule} from '@nestjs/common'
import {PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {FakeMailProvider, MailsModule} from '@wepublish/mails'
import {
  BexioPaymentProvider,
  PaymentProvider,
  PaymentsModule,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider
} from '@wepublish/payments'
import bodyParser from 'body-parser'
import {ConfigModule, ConfigService} from '@nestjs/config'

export function registerPrismaModule(prismaClient: PrismaClient): DynamicModule {
  return {
    module: PrismaModule,
    providers: [
      {
        provide: PrismaClient,
        useFactory: () => prismaClient as PrismaService
      }
    ],
    exports: [PrismaService]
  }
}

export function registerMailsModule(): DynamicModule {
  return MailsModule.registerAsync({
    useFactory: () => ({
      defaultReplyToAddress: 'test@exmaple.com',
      defaultFromAddress: 'test@exmaple.com',
      mailProvider: new FakeMailProvider({
        id: 'fakeMail',
        name: 'Fake Mail',
        fromAddress: 'fakeMail@wepublish.media'
      })
    })
  })
}

export function registerPaymentsModule(): DynamicModule {
  return PaymentsModule.registerAsync({
    imports: [ConfigModule, PrismaModule],
    useFactory: (config: ConfigService, prisma: PrismaService) => {
      const paymentProviders: PaymentProvider[] = []

      if (
        config.get('BEXIO_API_KEY') &&
        config.get('BEXIO_USER_ID') &&
        config.get('BEXIO_COUNTRY_ID') &&
        config.get('BEXIO_INVOICE_TEMPLATE') &&
        config.get('BEXIO_UNIT_ID') &&
        config.get('BEXIO_TAX_ID') &&
        config.get('BEXIO_ACCOUNT_ID')
      ) {
        paymentProviders.push(
          new BexioPaymentProvider({
            id: 'bexio',
            name: 'Bexio Invoice',
            offSessionPayments: false,
            apiKey: config.getOrThrow('BEXIO_API_KEY'),
            userId: parseInt(config.getOrThrow('BEXIO_USER_ID')),
            countryId: parseInt(config.getOrThrow('BEXIO_COUNTRY_ID')),
            invoiceTemplateNewMembership: config.getOrThrow('BEXIO_INVOICE_TEMPLATE'),
            invoiceTemplateRenewalMembership: config.getOrThrow('BEXIO_INVOICE_TEMPLATE'),
            unitId: parseInt(config.getOrThrow('BEXIO_UNIT_ID')),
            taxId: parseInt(config.getOrThrow('BEXIO_TAX_ID')),
            accountId: parseInt(config.getOrThrow('BEXIO_ACCOUNT_ID')),
            invoiceTitleNewMembership: config.get('BEXIO_INVOICE_TITLE_NEW') || 'New Invoice',
            invoiceTitleRenewalMembership: config.get('BEXIO_INVOICE_TITLE_RENEW') || 'New Invoice',
            invoiceMailSubjectNewMembership:
              config.get('BEXIO_INVOICE_MAIL_SUBJECT_NEW') || 'Invoice for :memberPlan.name:',
            // [Network Link] is required by bexio => you can use replacer for user, subscription and memberPlan as you see in the example (any db fields are possible)
            invoiceMailBodyNewMembership:
              config.get('BEXIO_INVOICE_MAIL_BODY_NEW') ||
              'Hello :user.firstname:\n\nThank you for subscribing to :memberPlan.name:.\nYou can view your invoice here: [Network Link]\n\nBest wishes from the Wepublish team',
            invoiceMailSubjectRenewalMembership:
              config.get('BEXIO_INVOICE_MAIL_SUBJECT_RENEW') || 'Invoice for :memberPlan.name:',
            // [Network Link] is required by bexio => you can use replacer for user, subscription and memberPlan as you see in the example (any db fields are possible)
            invoiceMailBodyRenewalMembership:
              config.get('BEXIO_INVOICE_MAIL_BODY_RENEW') ||
              'Hello :user.firstname:\n\nThank you for subscribing to :memberPlan.name:.\nYou can view your invoice here: [Network Link]\n\nBest wishes from the Wepublish team',
            markInvoiceAsOpen: false,
            prisma
          })
        )
      }

      if (
        config.get('STRIPE_SECRET_KEY') &&
        config.get('STRIPE_CHECKOUT_WEBHOOK_SECRET') &&
        config.get('STRIPE_WEBHOOK_SECRET')
      ) {
        paymentProviders.push(
          new StripeCheckoutPaymentProvider({
            id: 'stripe_checkout',
            name: 'Stripe Checkout',
            offSessionPayments: false,
            secretKey: config.getOrThrow('STRIPE_SECRET_KEY'),
            webhookEndpointSecret: config.getOrThrow('STRIPE_CHECKOUT_WEBHOOK_SECRET'),
            incomingRequestHandler: bodyParser.raw({type: 'application/json'})
          }),
          new StripePaymentProvider({
            id: 'stripe',
            name: 'Stripe',
            offSessionPayments: true,
            secretKey: config.getOrThrow('STRIPE_SECRET_KEY'),
            webhookEndpointSecret: config.getOrThrow('STRIPE_WEBHOOK_SECRET'),
            incomingRequestHandler: bodyParser.raw({type: 'application/json'})
          })
        )
      }

      if (
        config.get('PAYREXX_INSTANCE_NAME') &&
        config.get('PAYREXX_API_SECRET') &&
        config.get('PAYREXX_WEBHOOK_SECRET')
      ) {
        paymentProviders.push(
          new PayrexxPaymentProvider({
            id: 'payrexx',
            name: 'Payrexx',
            offSessionPayments: false,
            instanceName: config.getOrThrow('PAYREXX_INSTANCE_NAME'),
            instanceAPISecret: config.getOrThrow('PAYREXX_API_SECRET'),
            psp: [0, 15, 17, 2, 3, 36],
            pm: [
              'postfinance_card',
              'postfinance_efinance',
              // "mastercard",
              // "visa",
              'twint',
              // "invoice",
              'paypal'
            ],
            vatRate: 7.7,
            incomingRequestHandler: bodyParser.json()
          })
        )
        paymentProviders.push(
          new PayrexxSubscriptionPaymentProvider({
            id: 'payrexx-subscription',
            name: 'Payrexx Subscription',
            offSessionPayments: false,
            instanceName: config.getOrThrow('PAYREXX_INSTANCE_NAME'),
            instanceAPISecret: config.getOrThrow('PAYREXX_API_SECRET'),
            incomingRequestHandler: bodyParser.json(),
            webhookSecret: config.getOrThrow('PAYREXX_WEBHOOK_SECRET'),
            prisma
          })
        )
      }
      return {paymentProviders}
    },
    inject: [ConfigService, PrismaService]
  })
}
