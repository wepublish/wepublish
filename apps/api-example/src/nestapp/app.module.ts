import {ApolloDriverConfig, ApolloGatewayDriver} from '@nestjs/apollo'
import {Global, Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {GraphQLModule} from '@nestjs/graphql'
import {ScheduleModule} from '@nestjs/schedule'
import {
  AgendaBaselService,
  AuthenticationModule,
  AuthorModule,
  BexioPaymentProvider,
  ConsentModule,
  DashboardModule,
  EventsImportModule,
  GraphQLRichText,
  HealthModule,
  KarmaMediaAdapter,
  KulturZueriService,
  MailchimpMailProvider,
  MailgunMailProvider,
  MailsModule,
  MediaAdapterService,
  MembershipModule,
  NavigationModule,
  NeverChargePaymentProvider,
  PaymentProvider,
  PaymentsModule,
  PaymentMethodModule,
  PayrexxFactory,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  PermissionModule,
  SettingModule,
  StatsModule,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
  MemberPlanModule,
  BlockModule
} from '@wepublish/api'
import {ApiModule, PrismaModule} from '@wepublish/nest-modules'
import bodyParser from 'body-parser'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import {URL} from 'url'
import {SlackMailProvider} from '../app/slack-mail-provider'
import {readConfig} from '../readConfig'
import {EventModule} from '@wepublish/event/api'
import {BlockStylesModule} from '@wepublish/block-content/api'
import {PrismaClient} from '@prisma/client'
import {UserRoleModule} from '@wepublish/user-role/api'
import {ActionModule} from '@wepublish/action/api'
import {PageModule} from '@wepublish/page/api'

@Global()
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloGatewayDriver,
      resolvers: {RichText: GraphQLRichText},
      autoSchemaFile: './apps/api-example/schema-v2.graphql',
      sortSchema: true,
      path: 'v2',
      cache: 'bounded',
      playground: process.env.NODE_ENV === 'development',
      allowBatchedHttpRequests: true
    }),
    PrismaModule,
    MailsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))
        const mailProviderRaw = configFile.mailProvider
        let mailProvider
        if (mailProviderRaw) {
          if (mailProviderRaw.id === 'mailgun') {
            const mailgunClient = new Mailgun(FormData).client({
              username: 'api',
              key: mailProviderRaw.apiKey,
              url: `https://${mailProviderRaw.baseDomain}`
            })
            mailProvider = new MailgunMailProvider({
              id: 'mailgun',
              name: 'Mailgun',
              fromAddress: mailProviderRaw.fromAddress,
              webhookEndpointSecret: mailProviderRaw.webhookEndpointSecret,
              baseDomain: mailProviderRaw.baseDomain,
              mailDomain: mailProviderRaw.mailDomain,
              apiKey: mailProviderRaw.apiKey,
              incomingRequestHandler: bodyParser.json(),
              mailgunClient
            })
          } else if (mailProviderRaw.id === 'mailchimp') {
            mailProvider = new MailchimpMailProvider({
              id: 'mailchimp',
              name: 'Mailchimp',
              fromAddress: mailProviderRaw.fromAddress,
              webhookEndpointSecret: mailProviderRaw.webhookEndpointSecret,
              apiKey: mailProviderRaw.apiKey,
              baseURL: mailProviderRaw.baseURL,
              incomingRequestHandler: bodyParser.urlencoded({extended: true})
            })
          } else if (mailProviderRaw.id === 'slackMail') {
            mailProvider = new SlackMailProvider({
              id: 'slackMail',
              name: 'Slack Mail',
              fromAddress: mailProviderRaw.fromAddress,
              webhookURL: mailProviderRaw.webhookURL
            })
          } else {
            throw new Error(`Unknown mail provider type defined: ${mailProviderRaw.id}`)
          }
        }

        if (!mailProvider) {
          throw new Error('A MailProvider must be configured.')
        }

        return {
          defaultFromAddress: configFile.mailProvider.fromAddress,
          defaultReplyToAddress: configFile.mailProvider.replyToAddress,
          mailProvider
        }
      },
      inject: [ConfigService],
      global: true
    }),
    PaymentsModule.registerAsync({
      imports: [ConfigModule, PrismaModule],
      useFactory: async (config: ConfigService, prisma: PrismaClient) => {
        const paymentProviders: PaymentProvider[] = []
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))
        const paymentProvidersRaw = configFile.paymentProviders
        if (paymentProvidersRaw) {
          for (const paymentProvider of paymentProvidersRaw) {
            if (paymentProvider.type === 'stripe-checkout') {
              paymentProviders.push(
                new StripeCheckoutPaymentProvider({
                  id: paymentProvider.id,
                  name: paymentProvider.name,
                  offSessionPayments: paymentProvider.offSessionPayments,
                  secretKey: paymentProvider.secretKey,
                  webhookEndpointSecret: paymentProvider.webhookEndpointSecret,
                  incomingRequestHandler: bodyParser.raw({type: 'application/json'})
                })
              )
            } else if (paymentProvider.type === 'stripe') {
              paymentProviders.push(
                new StripePaymentProvider({
                  id: paymentProvider.id,
                  name: paymentProvider.name,
                  offSessionPayments: paymentProvider.offSessionPayments,
                  secretKey: paymentProvider.secretKey,
                  webhookEndpointSecret: paymentProvider.webhookEndpointSecret,
                  incomingRequestHandler: bodyParser.raw({type: 'application/json'})
                })
              )
            } else if (paymentProvider.type === 'payrexx') {
              const payrexxFactory = new PayrexxFactory({
                baseUrl: 'https://api.payrexx.com/v1.0/',
                instance: paymentProvider.instanceName,
                secret: paymentProvider.instanceAPISecret
              })

              paymentProviders.push(
                new PayrexxPaymentProvider({
                  id: paymentProvider.id,
                  name: paymentProvider.name,
                  offSessionPayments: paymentProvider.offSessionPayments,
                  transactionClient: payrexxFactory.transactionClient,
                  gatewayClient: payrexxFactory.gatewayClient,
                  webhookApiKey: paymentProvider.webhookApiKey,
                  psp: paymentProvider.psp,
                  pm: paymentProvider.pm,
                  vatRate: paymentProvider.vatRate,
                  incomingRequestHandler: bodyParser.json()
                })
              )
            } else if (paymentProvider.type === 'payrexx-subscription') {
              paymentProviders.push(
                new PayrexxSubscriptionPaymentProvider({
                  id: paymentProvider.id,
                  name: paymentProvider.name,
                  offSessionPayments: true,
                  instanceName: paymentProvider.instanceName,
                  instanceAPISecret: paymentProvider.instanceAPISecret,
                  webhookSecret: paymentProvider.webhookEndpointSecret,
                  prisma
                })
              )
            } else if (paymentProvider.type === 'bexio') {
              paymentProviders.push(
                new BexioPaymentProvider({
                  id: paymentProvider.id,
                  name: paymentProvider.name,
                  offSessionPayments: false,
                  apiKey: paymentProvider.apiKey,
                  userId: paymentProvider.userId,
                  countryId: paymentProvider.countryId,
                  invoiceTemplateNewMembership: paymentProvider.invoiceTemplateNewMembership,
                  invoiceTemplateRenewalMembership:
                    paymentProvider.invoiceTemplateRenewalMembership,
                  unitId: paymentProvider.unitId,
                  taxId: paymentProvider.taxId,
                  accountId: paymentProvider.accountId,
                  invoiceTitleNewMembership: paymentProvider.invoiceTitleNewMembership,
                  invoiceTitleRenewalMembership: paymentProvider.invoiceTitleRenewalMembership,
                  invoiceMailSubjectNewMembership: paymentProvider.invoiceMailSubjectNewMembership,
                  invoiceMailBodyNewMembership: paymentProvider.invoiceMailBodyNewMembership,
                  invoiceMailSubjectRenewalMembership:
                    paymentProvider.invoiceMailSubjectRenewalMembership,
                  invoiceMailBodyRenewalMembership:
                    paymentProvider.invoiceMailBodyRenewalMembership,
                  markInvoiceAsOpen: paymentProvider.markInvoiceAsOpen,
                  prisma
                })
              )
            } else if (paymentProvider.type === 'no-charge') {
              paymentProviders.push(
                new NeverChargePaymentProvider({
                  id: paymentProvider.id,
                  name: paymentProvider.name,
                  offSessionPayments: paymentProvider.offSessionPayments
                })
              )
            } else {
              throw new Error(
                `Unknown payment provider type defined: ${(paymentProvider as any).type}`
              )
            }
          }
        }
        return {paymentProviders}
      },
      inject: [ConfigService, PrismaClient],
      global: true
    }),
    ApiModule,
    MembershipModule,
    DashboardModule,
    AuthenticationModule,
    PermissionModule,
    ConsentModule,
    StatsModule,
    SettingModule,
    EventModule,
    NavigationModule,
    AuthorModule,
    PaymentMethodModule,
    ActionModule,
    UserRoleModule,
    MemberPlanModule,
    BlockStylesModule,
    BlockModule,
    PageModule,
    EventsImportModule.registerAsync({
      useFactory: (agendaBasel: AgendaBaselService, kulturZueri: KulturZueriService) => [
        agendaBasel,
        kulturZueri
      ],
      inject: [AgendaBaselService, KulturZueriService]
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    HealthModule
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
