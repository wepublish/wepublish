import {PrismaClient} from '@prisma/client'
import {DynamicModule} from '@nestjs/common'
import {PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {FakeMailProvider, MailsModule} from '@wepublish/mail/api'
import {
  PaymentProvider,
  PaymentsModule,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider
} from '@wepublish/payment/api'
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
            offSessionPayments: true,
            instanceName: config.getOrThrow('PAYREXX_INSTANCE_NAME'),
            instanceAPISecret: config.getOrThrow('PAYREXX_API_SECRET'),
            psp: [0, 15, 17, 2, 3, 36],
            pm: ['postfinance_card', 'postfinance_efinance', 'twint', 'paypal'],
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
