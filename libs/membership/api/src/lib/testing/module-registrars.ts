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
import { NamespacedCache, NamespaceResets } from '@wepublish/kv-ttl-cache/api';

const SEED_TTL_SECONDS = 60 * 60;

export function registerPrismaModule(
  prismaClient: PrismaClient
): DynamicModule {
  return PrismaModule.forTest(prismaClient);
}

export function registerMailsModule(): DynamicModule {
  return MailsModule.registerAsync({
    imports: [PrismaModule],
    inject: [PrismaClient, NamespacedCache],
    useFactory: async (prisma: PrismaClient, kv: NamespacedCache) => {
      await kv.setNs(
        'settings:mailprovider',
        'fakeMail',
        {
          id: 'slack',
          type: 'slack',
          name: 'Fake Mail',
          fromAddress: 'fakeMail@wepublish.ch',
          replyTpAddress: 'dev@wepublish.ch',
          webhookEndpointSecret: 'secret',
          apiKey: 'key',
        },
        SEED_TTL_SECONDS
      );

      return {
        mailProvider: new FakeMailProvider({
          id: 'fakeMail',
          prisma,
          kv,
        }),
        jwtGenerator: async () => 'test-jwt-token',
      };
    },
  });
}

export function registerPaymentMethodModule(): DynamicModule {
  return PaymentMethodModule.registerAsync({
    imports: [ConfigModule, PrismaModule],
    useFactory: async (
      config: ConfigService,
      prisma: PrismaClient,
      kv: NamespacedCache,
      resets: NamespaceResets
    ) => {
      const paymentProviders: PaymentProvider[] = [];
      paymentProviders.push(
        new StripeCheckoutPaymentProvider({
          id: 'stripe_checkout',
          incomingRequestHandler: bodyParser.raw({
            type: 'application/json',
          }),
          prisma,
          kv,
          resets,
        }),
        new StripePaymentProvider({
          id: 'stripe',
          incomingRequestHandler: bodyParser.raw({
            type: 'application/json',
          }),
          prisma,
          kv,
          resets,
        })
      );

      await kv.setNs(
        'settings:paymentprovider',
        'stripe_checkout',
        {
          id: 'stripe_checkout',
          type: 'stripe-checkout',
          name: 'Stripe Checkout',
          offSessionPayments: false,
          apiKey: '123',
          webhookEndpointSecret: '123',
          stripe_methods: ['CARD'],
        },
        SEED_TTL_SECONDS
      );
      await kv.setNs(
        'settings:paymentprovider',
        'stripe',
        {
          id: 'stripe',
          type: 'Stripe',
          name: 'Stripe',
          offSessionPayments: true,
          apiKey: '123',
          webhookEndpointSecret: '123',
          stripe_methods: ['CARD'],
        },
        SEED_TTL_SECONDS
      );

      paymentProviders.push(
        new PayrexxPaymentProvider({
          id: 'payrexx',
          incomingRequestHandler: bodyParser.json(),
          prisma,
          kv,
          resets,
        })
      );
      paymentProviders.push(
        new PayrexxSubscriptionPaymentProvider({
          id: 'payrexx-subscription',
          prisma,
          kv,
          resets,
        })
      );

      await kv.setNs(
        'settings:paymentprovider',
        'payrexx',
        {
          id: 'payrexx',
          type: 'payrexx',
          name: 'Payrexx',
          offSessionPayments: false,
          apiKey: '1234',
          webhookEndpointSecret: 'secret',
          payrexx_instancename: 'test',
          payrexx_psp: ['PAYPAL', 'TWINT', 'STRIPE'],
          payrexx_pm: ['PAYPAL', 'TWINT', 'APPLE_PAY'],
          payrexx_vatrate: 7.7,
        },
        SEED_TTL_SECONDS
      );

      await kv.setNs(
        'settings:paymentprovider',
        'payrexx-subscription',
        {
          id: 'payrexx-subscription',
          type: 'payrexx-subscription',
          name: 'Payrexx Subscription',
          offSessionPayments: false,
          apiKey: '1234',
          webhookEndpointSecret: 'secret',
          payrexx_instancename: 'test',
        },
        SEED_TTL_SECONDS
      );
      paymentProviders.push(
        new MolliePaymentProvider({
          id: 'mollie',
          incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
          prisma,
          kv,
          resets,
        })
      );
      await kv.setNs(
        'settings:paymentprovider',
        'mollie',
        {
          id: 'mollie',
          type: 'mollie',
          name: 'Mollie',
          offSessionPayments: true,
          apiKey: 'secret',
          webhookEndpointSecret: 'secret',
          mollie_apiBaseUrl: "https://wepublish.ch'",
          stripe_methods: ['PAYPAL', 'TWINT', 'IDEAL'],
        },
        SEED_TTL_SECONDS
      );
      return { paymentProviders };
    },
    inject: [ConfigService, PrismaClient, NamespacedCache, NamespaceResets],
    global: true,
  });
}
