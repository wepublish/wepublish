import { PrismaClient } from '@prisma/client';
import { DynamicModule } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { FakeMailProvider, MailsModule } from '@wepublish/mail/api';
import {
  MolliePaymentProvider,
  PaymentMethodModule,
  PaymentProvider,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
} from '@wepublish/payment/api';
import bodyParser from 'body-parser';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';

export function registerPrismaModule(
  prismaClient: PrismaClient
): DynamicModule {
  return PrismaModule.forTest(prismaClient);
}

export function registerMailsModule(): DynamicModule {
  return MailsModule.registerAsync({
    imports: [PrismaModule, KvTtlCacheModule],
    inject: [PrismaClient, KvTtlCacheService],
    useFactory: async (prisma: PrismaClient, kv: KvTtlCacheService) => {
      await kv.setNs(
        'settings:mailprovider',
        'fakeMail',
        JSON.stringify({
          id: 'slack',
          type: 'slack',
          name: 'Fake Mail',
          fromAddress: 'fakeMail@wepublish.media',
          replyTpAddress: 'dev@wepublish.ch',
          webhookEndpointSecret: 'secret',
          apiKey: 'key',
        })
      );

      return {
        mailProvider: new FakeMailProvider({
          id: 'fakeMail',
          prisma,
          kv,
        }),
      };
    },
  });
}

export function registerPaymentMethodModule(): DynamicModule {
  return PaymentMethodModule.registerAsync({
    imports: [ConfigModule, PrismaModule, KvTtlCacheModule],
    useFactory: async (
      config: ConfigService,
      prisma: PrismaClient,
      kv: KvTtlCacheService
    ) => {
      const paymentProviders: PaymentProvider[] = [];

      if (
        config.get('STRIPE_SECRET_KEY') &&
        config.get('STRIPE_CHECKOUT_WEBHOOK_SECRET') &&
        config.get('STRIPE_WEBHOOK_SECRET')
      ) {
        paymentProviders.push(
          new StripeCheckoutPaymentProvider({
            id: 'stripe_checkout',
            incomingRequestHandler: bodyParser.raw({
              type: 'application/json',
            }),
            prisma,
            kv,
          }),
          new StripePaymentProvider({
            id: 'stripe',
            incomingRequestHandler: bodyParser.raw({
              type: 'application/json',
            }),
            prisma,
            kv,
          })
        );

        await kv.setNs(
          'settings:paymentprovider',
          'stripe_checkout',
          JSON.stringify({
            id: 'stripe_checkout',
            type: 'stripe-checkout',
            name: 'Stripe Checkout',
            offSessionPayments: false,
            apiKey: config.getOrThrow('STRIPE_SECRET_KEY'),
            webhookEndpointSecret: config.getOrThrow('STRIPE_SECRET_KEY'),
            stripe_methods: ['CARD'],
          })
        );
        await kv.setNs(
          'settings:paymentprovider',
          'stripe',
          JSON.stringify({
            id: 'stripe',
            type: 'Stripe',
            name: 'Stripe Checkout',
            offSessionPayments: true,
            apiKey: config.getOrThrow('STRIPE_SECRET_KEY'),
            webhookEndpointSecret: config.getOrThrow('STRIPE_SECRET_KEY'),
            stripe_methods: ['CARD'],
          })
        );
      }

      if (
        config.get('PAYREXX_INSTANCE_NAME') &&
        config.get('PAYREXX_API_SECRET') &&
        config.get('PAYREXX_WEBHOOK_SECRET')
      ) {
        paymentProviders.push(
          new PayrexxPaymentProvider({
            id: 'payrexx',
            incomingRequestHandler: bodyParser.json(),
            prisma,
            kv,
          })
        );
        paymentProviders.push(
          new PayrexxSubscriptionPaymentProvider({
            id: 'payrexx-subscription',
            prisma,
            kv,
          })
        );

        await kv.setNs(
          'settings:paymentprovider',
          'payrexx',
          JSON.stringify({
            id: 'payrexx',
            type: 'payrexx',
            name: 'Payrexx',
            offSessionPayments: false,
            apiKey: config.getOrThrow('PAYREXX_API_SECRET'),
            webhookEndpointSecret: config.getOrThrow('PAYREXX_WEBHOOK_SECRET'),
            payrexx_instancename: config.getOrThrow('PAYREXX_INSTANCE_NAME'),
            payrexx_psp: ['PAYPAL', 'TWINT', 'STRIPE'],
            payrexx_pm: ['PAYPAL', 'TWINT', 'APPLE_PAY'],
            payrexx_vatrate: 7.7,
          })
        );

        await kv.setNs(
          'settings:paymentprovider',
          'payrexx-subscription',
          JSON.stringify([
            {
              id: 'payrexx-subscription',
              type: 'payrexx-subscription',
              name: 'Payrexx Subscription',
              offSessionPayments: false,
              apiKey: config.getOrThrow('PAYREXX_API_SECRET'),
              webhookEndpointSecret: config.getOrThrow(
                'PAYREXX_WEBHOOK_SECRET'
              ),
              payrexx_instancename: config.getOrThrow('PAYREXX_INSTANCE_NAME'),
            },
          ])
        );
      }
      if (config.get('MOLLIE_API_SECRET')) {
        paymentProviders.push(
          new MolliePaymentProvider({
            id: 'mollie',
            incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
            prisma,
            kv,
          })
        );
        await kv.setNs(
          'settings:paymentprovider',
          'mollie',
          JSON.stringify([
            {
              id: 'mollie',
              type: 'mollie',
              name: 'Mollie',
              offSessionPayments: true,
              apiKey: config.getOrThrow('MOLLIE_API_SECRET'),
              webhookEndpointSecret: 'secret',
              mollie_apiBaseUrl: "https://wepublish.ch'",
              stripe_methods: ['PAYPAL', 'TWINT', 'IDEAL'],
            },
          ])
        );
      }
      return { paymentProviders };
    },
    inject: [ConfigService, PrismaClient, KvTtlCacheService],
    global: true,
  });
}
