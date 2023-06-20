import {Module, Global} from '@nestjs/common'
import {ApiModule, PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {DashboardModule, MembershipModule} from '@wepublish/membership/api'
import {
  SettingModule,
  AuthenticationModule,
  PermissionModule,
  ConsentModule,
  MediaAdapterService,
  KarmaMediaAdapter
} from '@wepublish/api'
import {ScheduleModule} from '@nestjs/schedule'
import {MailsModule, BaseMailProvider, MailgunMailProvider} from '@wepublish/mails'
import process from 'process'
import bodyParser from 'body-parser'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'
import {
  PaymentProviders,
  PaymentsModule,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider
} from '@wepublish/payments'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {URL} from 'url'
import {JobsModule} from '@wepublish/jobs'

@Global()
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: './apps/api-example/schema-v2.graphql',
      sortSchema: true,
      path: 'v2',
      cors: {
        credentials: true,
        origin: true
      },
      cache: 'bounded'
    }),
    PrismaModule,
    MailsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        defaultFromAddress: config.getOrThrow('DEFAULT_FROM_ADDRESS'),
        defaultReplyToAddress: config.getOrThrow('DEFAULT_REPLY_TO_ADDRESS'),
        mailProvider: new MailgunMailProvider({
          id: 'mailgun',
          name: 'Mailgun',
          fromAddress: config.getOrThrow('DEFAULT_FROM_ADDRESS'),
          webhookEndpointSecret: config.getOrThrow('MAILGUN_WEBHOOK_SECRET'),
          baseDomain: config.getOrThrow('MAILGUN_BASE_DOMAIN'),
          mailDomain: config.getOrThrow('MAILGUN_MAIL_DOMAIN'),
          apiKey: config.getOrThrow('MAILGUN_API_KEY'),
          incomingRequestHandler: bodyParser.json(),
          mailgunClient: new Mailgun(FormData).client({
            username: 'api',
            key: config.get('MAILGUN_API_KEY', 'dev-api-key')
          })
        })
      }),
      inject: [ConfigService]
    }),
    PaymentsModule,
    ApiModule,
    MembershipModule,
    DashboardModule,
    AuthenticationModule,
    PermissionModule,
    ConsentModule,
    SettingModule,
    ScheduleModule.forRoot(),
    JobsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        databaseUrl: config.getOrThrow('DATABASE_URL')
      }),
      inject: [ConfigService]
    }),
    ConfigModule.forRoot()
  ],
  exports: [BaseMailProvider, PaymentProviders, MediaAdapterService],
  providers: [
    {
      provide: PaymentProviders,
      useFactory: (prisma: PrismaService) => {
        const paymentProviders = []

        if (
          process.env.STRIPE_SECRET_KEY &&
          process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET &&
          process.env.STRIPE_WEBHOOK_SECRET
        ) {
          paymentProviders.push(
            new StripeCheckoutPaymentProvider({
              id: 'stripe_checkout',
              name: 'Stripe Checkout',
              offSessionPayments: false,
              secretKey: process.env.STRIPE_SECRET_KEY,
              webhookEndpointSecret: process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET,
              incomingRequestHandler: bodyParser.raw({type: 'application/json'})
            }),
            new StripePaymentProvider({
              id: 'stripe',
              name: 'Stripe',
              offSessionPayments: true,
              secretKey: process.env.STRIPE_SECRET_KEY,
              webhookEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
              incomingRequestHandler: bodyParser.raw({type: 'application/json'})
            })
          )
        }

        if (
          process.env.PAYREXX_INSTANCE_NAME &&
          process.env.PAYREXX_API_SECRET &&
          process.env.PAYREXX_WEBHOOK_SECRET
        ) {
          paymentProviders.push(
            new PayrexxPaymentProvider({
              id: 'payrexx',
              name: 'Payrexx',
              offSessionPayments: false,
              instanceName: process.env.PAYREXX_INSTANCE_NAME,
              instanceAPISecret: process.env.PAYREXX_API_SECRET,
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
              instanceName: process.env.PAYREXX_INSTANCE_NAME,
              instanceAPISecret: process.env.PAYREXX_API_SECRET,
              incomingRequestHandler: bodyParser.json(),
              webhookSecret: process.env.PAYREXX_WEBHOOK_SECRET,
              prisma
            })
          )
        }
        return paymentProviders
      },
      inject: [PrismaService]
    },
    {
      provide: MediaAdapterService,
      useFactory: (config: ConfigService) => {
        const internalUrl = config.get('MEDIA_SERVER_INTERNAL_URL')

        return new KarmaMediaAdapter(
          new URL(config.getOrThrow('MEDIA_SERVER_URL')),
          config.getOrThrow('MEDIA_SERVER_TOKEN'),
          internalUrl ? new URL(internalUrl) : undefined
        )
      },
      inject: [ConfigService]
    }
  ]
})
export class AppModule {}
