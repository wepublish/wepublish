import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Global, Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {GraphQLModule} from '@nestjs/graphql'
import {
  AgendaBaselService,
  KulturZueriService,
  AuthenticationModule,
  ConsentModule,
  DashboardModule,
  EventsImportModule,
  KarmaMediaAdapter,
  MediaAdapterService,
  PermissionModule,
  SettingModule
} from '@wepublish/api'
import {
  PaymentProvider,
  PaymentsModule,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
  BexioPaymentProvider
} from '@wepublish/payments'
import {ApiModule, PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {URL} from 'url'
import {JobsModule} from '@wepublish/jobs'
import bodyParser from 'body-parser'

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
    JobsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        databaseUrl: config.getOrThrow('DATABASE_URL')
      }),
      inject: [ConfigService]
    }),
    ConfigModule.forRoot()
  ],
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
  ],
  exports: [MediaAdapterService]
})
export class AppModule {}
