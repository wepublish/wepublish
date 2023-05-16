import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Global, Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {DashboardModule, MembershipModule} from '@wepublish/membership/api'
import {ApiModule, PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {SettingModule, AuthenticationModule, PermissionModule, ConsentModule} from '@wepublish/api'
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
      }
    }),
    PrismaModule,
    MailsModule,
    PaymentsModule,
    ApiModule,
    MembershipModule,
    DashboardModule,
    AuthenticationModule,
    PermissionModule,
    ConsentModule,
    SettingModule,
    ScheduleModule.forRoot()
  ],
  exports: [BaseMailProvider, PaymentProviders],
  providers: [
    {
      provide: BaseMailProvider,
      useFactory: () =>
        new MailgunMailProvider({
          id: 'mailgun',
          name: 'Mailgun',
          fromAddress: 'dev@wepublish.ch',
          webhookEndpointSecret: process.env.MAILGUN_WEBHOOK_SECRET!,
          baseDomain: process.env.MAILGUN_BASE_DOMAIN!,
          mailDomain: process.env.MAILGUN_MAIL_DOMAIN!,
          apiKey: process.env.MAILGUN_API_KEY!,
          incomingRequestHandler: bodyParser.json(),
          mailgunClient: new Mailgun(FormData).client({
            username: 'api',
            key: process.env.MAILGUN_API_KEY || 'dev-api-key'
          })
        })
    },
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
    }
  ]
})
export class AppModule {}
