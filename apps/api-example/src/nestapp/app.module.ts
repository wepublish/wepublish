import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {Global, Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {GraphQLModule} from '@nestjs/graphql'
import {ScheduleModule} from '@nestjs/schedule'

import {HttpModule, HttpService} from '@nestjs/axios'
import {PrismaClient} from '@prisma/client'
import {ActionModule} from '@wepublish/action/api'
import {KarmaMediaAdapter, NovaMediaAdapter} from '@wepublish/api'
import {ArticleModule, HotAndTrendingModule} from '@wepublish/article/api'
import {AuthenticationModule} from '@wepublish/authentication/api'
import {BannerApiModule} from '@wepublish/banner/api'
import {BlockContentModule} from '@wepublish/block-content/api'
import {CommentModule} from '@wepublish/comments/api'
import {ConsentModule} from '@wepublish/consent/api'
import {CrowdfundingApiModule} from '@wepublish/crowdfunding/api'
import {EventModule} from '@wepublish/event/api'
import {
  AgendaBaselService,
  EventsImportModule,
  KulturZueriService
} from '@wepublish/event/import/api'
import {GoogleAnalyticsModule, GoogleAnalyticsService} from '@wepublish/google-analytics/api'
import {HealthModule} from '@wepublish/health'
import {MediaAdapterModule} from '@wepublish/image/api'
import {MailchimpMailProvider, MailgunMailProvider, MailsModule} from '@wepublish/mail/api'
import {DashboardModule, MembershipModule, SubscriptionModule} from '@wepublish/membership/api'
import {NavigationModule} from '@wepublish/navigation/api'
import {
  ApiModule,
  HauptstadtURLAdapter,
  PrismaModule,
  URLAdapter,
  URLAdapterModule
} from '@wepublish/nest-modules'
import {PageModule} from '@wepublish/page/api'
import {
  BexioPaymentProvider,
  MolliePaymentProvider,
  NeverChargePaymentProvider,
  PaymentProvider,
  PaymentsModule,
  PayrexxFactory,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider
} from '@wepublish/payment/api'
import {PaywallModule} from '@wepublish/paywall/api'
import {PeerModule} from '@wepublish/peering/api'
import {ImportPeerArticleModule} from '@wepublish/peering/api/import'
import {PermissionModule} from '@wepublish/permissions/api'
import {PhraseModule} from '@wepublish/phrase/api'
import {PollModule} from '@wepublish/poll/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {SettingModule} from '@wepublish/settings/api'
import {StatsModule} from '@wepublish/stats/api'
import {SystemInfoModule} from '@wepublish/system-info'
import {TagModule} from '@wepublish/tag/api'
import {
  ProlitterisTrackingPixelProvider,
  TrackingPixelProvider,
  TrackingPixelsModule
} from '@wepublish/tracking-pixel/api'
import {UserModule} from '@wepublish/user/api'
import {VersionInformationModule} from '@wepublish/versionInformation/api'
import bodyParser from 'body-parser'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import {URL} from 'url'
import {SlackMailProvider} from '../app/slack-mail-provider'
import {readConfig} from '../readConfig'
import {PaymentMethodModule} from '@wepublish/payment-method/api'
import {AuthorModule} from '@wepublish/author/api'
import {MemberPlanModule} from '@wepublish/member-plan/api'
import {InvoiceModule} from '@wepublish/invoice/api'
import {SessionModule} from '@wepublish/session/api'
import {ChallengeModule} from '@wepublish/challenge/api'
import {UserSubscriptionModule} from '@wepublish/user-subscription/api'

@Global()
@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))

        return {
          resolvers: {RichText: GraphQLRichText},
          autoSchemaFile: './apps/api-example/schema-v2.graphql',
          sortSchema: true,
          path: 'v1',
          cache: 'bounded',
          introspection: configFile.general.apolloIntrospection,
          playground: configFile.general.apolloPlayground,
          allowBatchedHttpRequests: true,
          inheritResolversFromInterfaces: true
        } as ApolloDriverConfig
      }
    }),
    AuthorModule,
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
    TrackingPixelsModule.registerAsync({
      imports: [ConfigModule, HttpModule],
      useFactory: async (config: ConfigService, httpClient: HttpService) => {
        const trackingPixelProviders: TrackingPixelProvider[] = []
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))

        const trackingPixelProvidersRaw = configFile.trackingPixelProviders

        if (!trackingPixelProvidersRaw) {
          return {trackingPixelProviders}
        }

        for (const trackingPixelProvider of trackingPixelProvidersRaw) {
          if (trackingPixelProvider.type === 'prolitteris') {
            trackingPixelProviders.push(
              new ProlitterisTrackingPixelProvider(
                trackingPixelProvider.id,
                trackingPixelProvider.name,
                trackingPixelProvider.type,
                trackingPixelProvider.usePublisherInternalKey
                  ? {
                      memberNr: trackingPixelProvider.memberNr,
                      onlyPaidContentAccess: Boolean(trackingPixelProvider.onlyPaidContentAccess),
                      publisherInternalKeyDomain: trackingPixelProvider.publisherInternalKeyDomain,
                      usePublisherInternalKey: true
                    }
                  : {
                      memberNr: trackingPixelProvider.memberNr,
                      username: trackingPixelProvider.username,
                      password: trackingPixelProvider.password,
                      onlyPaidContentAccess: Boolean(trackingPixelProvider.onlyPaidContentAccess),
                      usePublisherInternalKey: false
                    },
                httpClient
              )
            )
          } else {
            throw new Error(
              `Unknown tracking Pixel type defined: ${(trackingPixelProvider as any).type}`
            )
          }
        }

        return {trackingPixelProviders}
      },
      inject: [ConfigService, HttpService]
    }),
    PaymentMethodModule,
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
                  incomingRequestHandler: bodyParser.raw({type: 'application/json'}),
                  methods: paymentProvider.methods,
                  prisma
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
                  incomingRequestHandler: bodyParser.raw({type: 'application/json'}),
                  methods: paymentProvider.methods,
                  prisma
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
                  incomingRequestHandler: bodyParser.json(),
                  prisma
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
            } else if (paymentProvider.type === 'mollie') {
              paymentProviders.push(
                new MolliePaymentProvider({
                  id: paymentProvider.id,
                  name: paymentProvider.name,
                  offSessionPayments: paymentProvider.offSessionPayments,
                  apiKey: paymentProvider.apiKey,
                  webhookEndpointSecret: paymentProvider.webhookEndpointSecret,
                  apiBaseUrl: paymentProvider.apiBaseUrl,
                  incomingRequestHandler: bodyParser.urlencoded({extended: true}),
                  methods: paymentProvider.methods,
                  prisma
                })
              )
            } else if (paymentProvider.type === 'no-charge') {
              paymentProviders.push(
                new NeverChargePaymentProvider({
                  id: paymentProvider.id,
                  name: paymentProvider.name,
                  offSessionPayments: paymentProvider.offSessionPayments,
                  prisma
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
    MemberPlanModule,
    ApiModule,
    MembershipModule,
    InvoiceModule,
    DashboardModule,
    AuthenticationModule,

    // Register SessionModule after AuthenticationModule
    // to ensure proper order of dependencies
    SessionModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const sessionTTL = parseInt(config.get('SESSION_TTL') || '0', 10) || 7 * 24 * 60 * 60 * 1000
        const jwtSecretKey = config.get('JWT_SECRET_KEY') || 'development-secret-key'
        const hostURL = config.get('HOST_URL') || 'http://localhost:4000'
        const websiteURL = config.get('WEBSITE_URL') || 'http://localhost:3000'

        if (process.env.NODE_ENV === 'production' && jwtSecretKey === 'development-secret-key') {
          console.warn('WARNING: Using default JWT secret key in production environment!')
        }

        return {
          sessionTTL,
          jwtSecretKey,
          hostURL,
          websiteURL
        }
      }
    }),
    PermissionModule,
    ConsentModule,
    StatsModule,
    SettingModule,
    EventModule,
    PageModule,
    PeerModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          hostURL: config.get('HOST_URL') || 'http://localhost:4000',
          websiteURL: config.get('WEBSITE_URL') || 'http://localhost:3000'
        }
      }
    }),
    CommentModule,
    ArticleModule,
    BlockContentModule,
    PollModule,
    PhraseModule,
    ActionModule,
    UserModule,
    UserSubscriptionModule,
    ChallengeModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))
        return {
          challenge: configFile.challenge || {
            type: 'algebraic',
            secret: 'default-challenge-secret',
            validTime: 600,
            width: 300,
            height: 100,
            background: '#ffffff',
            noise: 1,
            minValue: 1,
            maxValue: 10,
            operandAmount: 2,
            operandTypes: ['+'],
            mode: 'formula',
            targetSymbol: '?'
          }
        }
      },
      inject: [ConfigService]
    }),
    SubscriptionModule,
    NavigationModule,
    TagModule,
    EventsImportModule.registerAsync({
      useFactory: (agendaBasel: AgendaBaselService, kulturZueri: KulturZueriService) => [
        agendaBasel,
        kulturZueri
      ],
      inject: [AgendaBaselService, KulturZueriService]
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    HealthModule,
    SystemInfoModule,
    HotAndTrendingModule.registerAsync({
      imports: [
        GoogleAnalyticsModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => {
            const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))

            return {
              credentials: configFile.ga?.credentials,
              property: configFile.ga?.property,
              articlePrefix: configFile.ga?.articlePrefix
            }
          }
        })
      ],
      useFactory: (datasource: GoogleAnalyticsService) => datasource,
      inject: [GoogleAnalyticsService]
    }),
    BannerApiModule,
    VersionInformationModule,
    CrowdfundingApiModule,
    ImportPeerArticleModule,
    URLAdapterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))

        const urlAdapter =
          configFile.general.urlAdapter === 'hauptstadt'
            ? new HauptstadtURLAdapter(config.getOrThrow('WEBSITE_URL'))
            : new URLAdapter(config.getOrThrow('WEBSITE_URL'))

        return urlAdapter
      },
      inject: [ConfigService]
    }),
    MediaAdapterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(config.getOrThrow('CONFIG_FILE_PATH'))
        const internalUrl = config.get('MEDIA_SERVER_INTERNAL_URL')
        const token = config.getOrThrow('MEDIA_SERVER_TOKEN')

        if (configFile.mediaServer?.type === 'nova') {
          return new NovaMediaAdapter(
            config.getOrThrow('MEDIA_SERVER_URL'),
            token,
            internalUrl ? internalUrl : undefined
          )
        }

        console.warn('Running on deprecated karma media server migrate to nova media server!')
        return new KarmaMediaAdapter(
          new URL(config.getOrThrow('MEDIA_SERVER_URL')),
          token,
          internalUrl ? new URL(internalUrl) : undefined
        )
      },
      inject: [ConfigService]
    }),
    PaywallModule
  ],
  exports: ['SYSTEM_INFO_KEY'],
  providers: [
    {
      provide: 'SYSTEM_INFO_KEY',
      useFactory: (config: ConfigService) => {
        return config.get('SYSTEM_INFO_KEY')
      },
      inject: [ConfigService]
    }
    // System info key provider
  ]
})
export class AppModule {}
