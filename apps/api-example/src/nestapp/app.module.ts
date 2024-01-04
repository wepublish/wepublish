import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Global, Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {GraphQLModule} from '@nestjs/graphql'
import {ScheduleModule} from '@nestjs/schedule'
import {
  AgendaBaselService,
  AuthenticationModule,
  ConsentModule,
  DashboardModule,
  EventsImportModule,
  GraphQLRichText,
  KarmaMediaAdapter,
  KulturZueriService,
  MailchimpMailProvider,
  MailgunMailProvider,
  MailsModule,
  MediaAdapterService,
  MembershipModule,
  PaymentProvider,
  PaymentsModule,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  PermissionModule,
  SettingModule,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
  BexioPaymentProvider,
  PayrexxFactory
} from '@wepublish/api'
import {ApiModule, PrismaModule, PrismaService} from '@wepublish/nest-modules'
import bodyParser from 'body-parser'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
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
              apiKey: config.get('BEXIO_API_KEY'),
              userId: parseInt(config.get('BEXIO_USER_ID')),
              countryId: parseInt(config.get('BEXIO_COUNTRY_ID')),
              invoiceTemplateNewMembership: config.get('BEXIO_INVOICE_TEMPLATE'),
              invoiceTemplateRenewalMembership: config.get('BEXIO_INVOICE_TEMPLATE'),
              unitId: parseInt(config.get('BEXIO_UNIT_ID')),
              taxId: parseInt(config.get('BEXIO_TAX_ID')),
              accountId: parseInt(config.get('BEXIO_ACCOUNT_ID')),
              invoiceTitleNewMembership: config.get('BEXIO_INVOICE_TITLE_NEW') || 'New Invoice',
              invoiceTitleRenewalMembership:
                config.get('BEXIO_INVOICE_TITLE_RENEW') || 'New Invoice',
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
          const payrexxFactory = new PayrexxFactory({
            baseUrl: 'https://api.payrexx.com/v1.0/',
            instance: config.get('PAYREXX_INSTANCE_NAME'),
            secret: config.get('PAYREXX_API_SECRET')
          })
          paymentProviders.push(
            new PayrexxPaymentProvider({
              id: 'payrexx',
              name: 'Payrexx',
              offSessionPayments: true,
              transactionClient: payrexxFactory.transactionClient,
              gatewayClient: payrexxFactory.gatewayClient,
              psp: [0, 15, 17, 2, 3, 36],
              pm: config.get('PAYREXX_PAYMENT_METHODS')
                ? config.get('PAYREXX_PAYMENT_METHODS').split(',')
                : ['postfinance_card', 'postfinance_efinance', 'twint', 'paypal'],
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
