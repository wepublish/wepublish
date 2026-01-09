import { PrismaClient } from '@prisma/client';
import { DynamicModule } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { FakeMailProvider, MailsModule } from '@wepublish/mail/api';
import {
  MolliePaymentProvider,
  PaymentMethodModule,
  PaymentProvider,
  PayrexxFactory,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
} from '@wepublish/payment/api';
import bodyParser from 'body-parser';
import { ConfigModule, ConfigService } from '@nestjs/config';

export function registerPrismaModule(
  prismaClient: PrismaClient
): DynamicModule {
  return PrismaModule.forTest(prismaClient);
}

export function registerMailsModule(): DynamicModule {
  return MailsModule.registerAsync({
    useFactory: () => ({
      defaultReplyToAddress: 'test@exmaple.com',
      defaultFromAddress: 'test@exmaple.com',
      mailProvider: new FakeMailProvider({
        id: 'fakeMail',
        name: 'Fake Mail',
        fromAddress: 'fakeMail@wepublish.media',
      }),
    }),
  });
}

export function registerPaymentMethodModule(): DynamicModule {
  return PaymentMethodModule.registerAsync({
    imports: [ConfigModule, PrismaModule],
    useFactory: (config: ConfigService, prisma: PrismaClient) => {
      const paymentProviders: PaymentProvider[] = [];

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
            webhookEndpointSecret: config.getOrThrow('STRIPE_SECRET_KEY'),
            incomingRequestHandler: bodyParser.raw({
              type: 'application/json',
            }),
            methods: ['card'],
            prisma,
          }),
          new StripePaymentProvider({
            id: 'stripe',
            name: 'Stripe',
            offSessionPayments: true,
            secretKey: config.getOrThrow('STRIPE_SECRET_KEY'),
            webhookEndpointSecret: config.getOrThrow('STRIPE_SECRET_KEY'),
            incomingRequestHandler: bodyParser.raw({
              type: 'application/json',
            }),
            methods: ['card'],
            prisma,
          })
        );
      }

      if (
        config.get('PAYREXX_INSTANCE_NAME') &&
        config.get('PAYREXX_API_SECRET') &&
        config.get('PAYREXX_WEBHOOK_SECRET')
      ) {
        const payrexxFactory = new PayrexxFactory({
          baseUrl: 'https://api.payrexx.com/v1.0/',
          instance: config.getOrThrow('PAYREXX_INSTANCE_NAME'),
          secret: config.getOrThrow('PAYREXX_API_SECRET'),
        });
        paymentProviders.push(
          new PayrexxPaymentProvider({
            id: 'payrexx',
            name: 'Payrexx',
            offSessionPayments: false,
            gatewayClient: payrexxFactory.gatewayClient,
            transactionClient: payrexxFactory.transactionClient,
            webhookApiKey: config.getOrThrow('PAYREXX_WEBHOOK_SECRET'),
            psp: [0, 15, 17, 2, 3, 36],
            pm: ['postfinance_card', 'postfinance_efinance', 'twint', 'paypal'],
            vatRate: 7.7,
            incomingRequestHandler: bodyParser.json(),
            prisma,
          })
        );
        paymentProviders.push(
          new PayrexxSubscriptionPaymentProvider({
            id: 'payrexx-subscription',
            name: 'Payrexx Subscription',
            offSessionPayments: false,
            instanceName: config.getOrThrow('PAYREXX_INSTANCE_NAME'),
            instanceAPISecret: config.getOrThrow('PAYREXX_API_SECRET'),
            incomingRequestHandler: bodyParser.json(),
            webhookSecret: config.getOrThrow('PAYREXX_WEBHOOK_SECRET'),
            prisma,
          })
        );
      }
      if (config.get('MOLLIE_API_SECRET')) {
        paymentProviders.push(
          new MolliePaymentProvider({
            id: 'mollie',
            name: 'Mollie',
            offSessionPayments: true,
            incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
            apiKey: config.getOrThrow('MOLLIE_API_SECRET'),
            webhookEndpointSecret: 'secret',
            apiBaseUrl: 'https://wepublish.ch',
            prisma,
          })
        );
      }

      return { paymentProviders };
    },
    inject: [ConfigService, PrismaClient],
    global: true,
  });
}
