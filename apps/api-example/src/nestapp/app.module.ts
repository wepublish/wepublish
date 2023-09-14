import {Module, Global} from '@nestjs/common'
import {ApiModule, PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {GraphQLModule} from '@nestjs/graphql'
import {
  MembershipModule,
  AgendaBaselService,
  KulturZueriService,
  SettingModule,
  AuthenticationModule,
  ConsentModule,
  DashboardModule,
  EventsImportModule,
  MediaAdapterService,
  KarmaMediaAdapter,
  MailchimpMailProvider,
  PermissionModule,
  PaymentProvider,
  PaymentsModule,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
  MailsModule,
  MailgunMailProvider,
  GraphQLRichText,
  JobsModule
} from '@wepublish/api'
import {ScheduleModule} from '@nestjs/schedule'
import bodyParser from 'body-parser'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {URL} from 'url'
import {SlackMailProvider} from '../app/slack-mail-provider'

@Global()
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      resolvers: {RichText: GraphQLRichText},
      autoSchemaFile: './apps/api-example/schema-v2.graphql',
      sortSchema: true,
      path: 'v2',
      cache: 'bounded',
      playground: process.env.NODE_ENV === 'development'
    }),
    PrismaModule,
    MailsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        let mailProvider
        if (
          config.get('MAILGUN_API_KEY') &&
          config.get('MAILGUN_BASE_DOMAIN') &&
          config.get('MAILGUN_MAIL_DOMAIN')
        ) {
          const mailgunClient = new Mailgun(FormData).client({
            username: 'api',
            key: config.get('MAILGUN_API_KEY')
          })
          mailProvider = new MailgunMailProvider({
            id: 'mailgun',
            name: 'Mailgun',
            fromAddress:
              config.get('MAILGUN_FROM_ADDRESS') ||
              config.get('DEFAULT_FROM_ADDRESS') ||
              'dev@wepublish.ch',
            webhookEndpointSecret: config.get('MAILGUN_WEBHOOK_SECRET') || '',
            baseDomain: config.get('MAILGUN_BASE_DOMAIN'),
            mailDomain: config.get('MAILGUN_MAIL_DOMAIN'),
            apiKey: config.get('MAILGUN_API_KEY'),
            incomingRequestHandler: bodyParser.json(),
            mailgunClient
          })
        }

        if (config.get('MAILCHIMP_API_KEY')) {
          mailProvider = new MailchimpMailProvider({
            id: 'mailchimp',
            name: 'Mailchimp',
            fromAddress:
              config.get('MAILCHIMP_FROM_ADDRESS') ||
              config.get('DEFAULT_FROM_ADDRESS') ||
              'dev@wepublish.ch',
            webhookEndpointSecret: config.get('MAILCHIMP_WEBHOOK_SECRET') || '',
            apiKey: config.get('MAILCHIMP_API_KEY'),
            baseURL: '',
            incomingRequestHandler: bodyParser.urlencoded({extended: true})
          })
        }

        if (config.get('SLACK_DEV_MAIL_WEBHOOK_URL')) {
          mailProvider = new SlackMailProvider({
            id: 'slackMail',
            name: 'Slack Mail',
            fromAddress: 'fakeMail@wepublish.media',
            webhookURL: config.get('SLACK_DEV_MAIL_WEBHOOK_URL')
          })
        }

        if (!mailProvider) {
          throw new Error('A MailProvider must be configured.')
        }

        return {
          defaultFromAddress: config.getOrThrow('DEFAULT_FROM_ADDRESS'),
          defaultReplyToAddress: config.getOrThrow('DEFAULT_REPLY_TO_ADDRESS'),
          mailProvider
        }
      },
      inject: [ConfigService],
      global: true
    }),
    PaymentsModule.registerAsync({
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
              secretKey: config.get('STRIPE_SECRET_KEY'),
              webhookEndpointSecret: config.get('STRIPE_CHECKOUT_WEBHOOK_SECRET'),
              incomingRequestHandler: bodyParser.raw({type: 'application/json'})
            }),
            new StripePaymentProvider({
              id: 'stripe',
              name: 'Stripe',
              offSessionPayments: true,
              secretKey: config.get('STRIPE_SECRET_KEY'),
              webhookEndpointSecret: config.get('STRIPE_WEBHOOK_SECRET'),
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
              instanceName: config.get('PAYREXX_INSTANCE_NAME'),
              instanceAPISecret: config.get('PAYREXX_API_SECRET'),
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
              instanceName: config.get('PAYREXX_INSTANCE_NAME'),
              instanceAPISecret: config.get('PAYREXX_API_SECRET'),
              incomingRequestHandler: bodyParser.json(),
              webhookSecret: config.get('PAYREXX_WEBHOOK_SECRET'),
              prisma
            })
          )
        }
        return {paymentProviders}
      },
      inject: [ConfigService, PrismaService],
      global: true
    }),
    ApiModule,
    MembershipModule,
    DashboardModule,
    AuthenticationModule,
    PermissionModule,
    ConsentModule,
    SettingModule,
    EventsImportModule.registerAsync({
      useFactory: (agendaBasel: AgendaBaselService, kulturZueri: KulturZueriService) => [
        agendaBasel,
        kulturZueri
      ],
      inject: [AgendaBaselService, KulturZueriService]
    }),
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
  exports: [MediaAdapterService],
  providers: [
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
