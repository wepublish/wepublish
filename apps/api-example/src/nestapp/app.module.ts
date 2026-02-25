import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';

import { HttpModule, HttpService } from '@nestjs/axios';
import {
  PrismaClient,
  MailProviderType,
  PaymentProviderType,
} from '@prisma/client';
import { SentryModule } from '@sentry/nestjs/setup';
import { ActionModule } from '@wepublish/action/api';
import { NovaMediaAdapter } from '@wepublish/api';
import { ArticleModule, HotAndTrendingModule } from '@wepublish/article/api';
import { AuthenticationModule } from '@wepublish/authentication/api';
import { BannerApiModule } from '@wepublish/banner/api';
import { BlockContentModule } from '@wepublish/block-content/api';
import { CommentModule } from '@wepublish/comments/api';
import { ConsentModule } from '@wepublish/consent/api';
import { CrowdfundingModule } from '@wepublish/crowdfunding/api';
import { EventModule } from '@wepublish/event/api';
import {
  AgendaBaselService,
  EventsImportModule,
  KulturZueriService,
} from '@wepublish/event/import/api';
import {
  GoogleAnalyticsModule,
  GoogleAnalyticsService,
  GoogleAnalyticsDbConfig,
} from '@wepublish/google-analytics/api';
import { HealthModule } from '@wepublish/health';
import { MediaAdapterModule } from '@wepublish/image/api';
import {
  BaseMailProvider,
  MailchimpMailProvider,
  MailgunMailProvider,
  MailsModule,
} from '@wepublish/mail/api';
import {
  DashboardModule,
  MembershipModule,
  SubscriptionModule,
  UpgradeSubscriptionModule,
} from '@wepublish/membership/api';
import { NavigationModule } from '@wepublish/navigation/api';
import {
  ApiModule,
  HauptstadtURLAdapter,
  PrismaModule,
  URLAdapter,
  URLAdapterModule,
} from '@wepublish/nest-modules';
import { PageModule } from '@wepublish/page/api';
import {
  BexioPaymentProvider,
  MolliePaymentProvider,
  NeverChargePaymentProvider,
  PaymentProvider,
  PaymentsModule,
  PaymentMethodModule,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
} from '@wepublish/payment/api';
import { PaywallModule } from '@wepublish/paywall/api';
import { PeerModule } from '@wepublish/peering/api';
import { ImportPeerArticleModule } from '@wepublish/peering/api/import';
import { PermissionModule } from '@wepublish/permissions/api';
import { PhraseModule } from '@wepublish/phrase/api';
import { PollModule } from '@wepublish/poll/api';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { SettingModule } from '@wepublish/settings/api';
import { StatsModule } from '@wepublish/stats/api';
import { SystemInfoModule } from '@wepublish/system-info';
import { TagModule } from '@wepublish/tag/api';
import {
  ProlitterisTrackingPixelProvider,
  TrackingPixelProvider,
  TrackingPixelsModule,
} from '@wepublish/tracking-pixel/api';
import { UserModule } from '@wepublish/user/api';
import { VersionInformationModule } from '@wepublish/versionInformation/api';
import bodyParser from 'body-parser';
import { SlackMailProvider } from '../app/slack-mail-provider';
import { readConfig } from '../readConfig';
import { AuthorModule } from '@wepublish/author/api';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { InvoiceModule } from '@wepublish/membership/api';
import { SessionModule } from '@wepublish/session/api';
import { ChallengeModule } from '@wepublish/challenge/api';
import { UserSubscriptionModule } from '@wepublish/user-subscription/api';
import { V0Module } from '@wepublish/ai/api';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';

@Global()
@Module({
  imports: [
    SentryModule.forRoot(),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );

        return {
          resolvers: { RichText: GraphQLRichText },
          autoSchemaFile:
            process.env.NODE_ENV === 'production' ?
              true
            : './apps/api-example/schema-v2.graphql',
          sortSchema: true,
          path: 'v1',
          cache: 'bounded',
          persistedQueries: false,
          introspection: configFile.general.apolloIntrospection,
          playground: configFile.general.apolloPlayground,
          allowBatchedHttpRequests: true,
          inheritResolversFromInterfaces: true,
          csrfPrevention: false,
        } as ApolloDriverConfig;
      },
    }),
    KvTtlCacheModule,
    V0Module.registerAsync({
      imports: [PrismaModule, KvTtlCacheModule],
    }),
    AuthorModule,
    PrismaModule,
    MailsModule.registerAsync({
      imports: [ConfigModule, PrismaModule, KvTtlCacheModule],
      useFactory: async (
        config: ConfigService,
        prisma: PrismaClient,
        kv: KvTtlCacheService
      ) => {
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );
        const mailProviderRaw = configFile.mailProvider;
        let mailProvider: BaseMailProvider;

        if (mailProviderRaw?.type === 'mailgun') {
          mailProvider = new MailgunMailProvider({
            id: mailProviderRaw.id,
            incomingRequestHandler: bodyParser.json(),
            prisma,
            kv,
          });

          await mailProvider.initDatabaseConfiguration(
            MailProviderType.MAILGUN
          );
        } else if (mailProviderRaw?.type === 'mailchimp') {
          mailProvider = new MailchimpMailProvider({
            id: mailProviderRaw.id,
            incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
            kv,
            prisma,
          });

          await mailProvider.initDatabaseConfiguration(
            MailProviderType.MAILCHIMP
          );
        } else if (mailProviderRaw?.type === 'slackmail') {
          mailProvider = new SlackMailProvider({
            id: mailProviderRaw.id,
            kv,
            prisma,
          });

          await mailProvider.initDatabaseConfiguration(MailProviderType.SLACK);
        } else {
          throw new Error(
            `Unknown mail provider type defined: ${mailProviderRaw.id}`
          );
        }

        if (!mailProvider) {
          throw new Error('A MailProvider must be configured.');
        }

        return {
          mailProvider,
        };
      },
      inject: [ConfigService, PrismaClient, KvTtlCacheService],
      global: true,
    }),
    TrackingPixelsModule.registerAsync({
      imports: [ConfigModule, HttpModule, PrismaModule, KvTtlCacheModule],
      useFactory: async (
        config: ConfigService,
        httpClient: HttpService,
        prisma: PrismaClient,
        kv: KvTtlCacheService
      ) => {
        const trackingPixelProviders: TrackingPixelProvider[] = [];
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );

        const trackingPixelProvidersRaw = configFile.trackingPixelProviders;

        if (!trackingPixelProvidersRaw) {
          return { trackingPixelProviders };
        }

        for (const trackingPixelProvider of trackingPixelProvidersRaw) {
          if (trackingPixelProvider.type === 'prolitteris') {
            const trackingPixelProviderClass =
              new ProlitterisTrackingPixelProvider(
                trackingPixelProvider.id,
                prisma,
                kv,
                httpClient
              );

            await trackingPixelProviderClass.initDatabaseConfiguration(
              trackingPixelProvider.id,
              trackingPixelProvider.type
            );

            trackingPixelProviders.push(trackingPixelProviderClass);
          } else {
            throw new Error(
              `Unknown tracking Pixel type defined: ${(trackingPixelProvider as any).type}`
            );
          }
        }

        return { trackingPixelProviders };
      },
      inject: [ConfigService, HttpService, PrismaClient, KvTtlCacheService],
    }),
    PaymentMethodModule.registerAsync({
      imports: [ConfigModule, PrismaModule, KvTtlCacheModule],
      useFactory: async (
        config: ConfigService,
        prisma: PrismaClient,
        kv: KvTtlCacheService
      ) => {
        const paymentProviders: PaymentProvider[] = [];
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );
        const paymentProvidersRaw = configFile.paymentProviders;

        if (!paymentProvidersRaw) {
          return { paymentProviders };
        }

        for (const paymentProvider of paymentProvidersRaw) {
          if (paymentProvider.type === 'stripe-checkout') {
            const paymentMethod = new StripeCheckoutPaymentProvider({
              id: paymentProvider.id,
              incomingRequestHandler: bodyParser.raw({
                type: 'application/json',
              }),
              prisma,
              kv,
            });

            await paymentMethod.initDatabaseConfiguration(
              PaymentProviderType.STRIPE_CHECKOUT
            );

            paymentProviders.push(paymentMethod);
          } else if (paymentProvider.type === 'stripe') {
            const paymentMethod = new StripePaymentProvider({
              id: paymentProvider.id,
              incomingRequestHandler: bodyParser.raw({
                type: 'application/json',
              }),
              prisma,
              kv,
            });

            await paymentMethod.initDatabaseConfiguration(
              PaymentProviderType.STRIPE
            );

            paymentProviders.push(paymentMethod);
          } else if (paymentProvider.type === 'payrexx') {
            const paymentMethod = new PayrexxPaymentProvider({
              id: paymentProvider.id,
              incomingRequestHandler: bodyParser.json(),
              prisma,
              kv,
            });

            await paymentMethod.initDatabaseConfiguration(
              PaymentProviderType.PAYREXX
            );

            paymentProviders.push(paymentMethod);
          } else if (paymentProvider.type === 'payrexx-subscription') {
            const paymentMethod = new PayrexxSubscriptionPaymentProvider({
              id: paymentProvider.id,
              prisma,
              kv,
            });
            await paymentMethod.initDatabaseConfiguration(
              PaymentProviderType.PAYREXX_SUBSCRIPTION
            );
            paymentProviders.push(paymentMethod);
          } else if (paymentProvider.type === 'bexio') {
            const paymentMethod = new BexioPaymentProvider({
              id: paymentProvider.id,
              prisma,
              kv,
            });
            paymentProviders.push(paymentMethod);
            await paymentMethod.initDatabaseConfiguration(
              PaymentProviderType.BEXIO
            );
          } else if (paymentProvider.type === 'mollie') {
            const paymentMethod = new MolliePaymentProvider({
              id: paymentProvider.id,
              incomingRequestHandler: bodyParser.urlencoded({
                extended: true,
              }),
              prisma,
              kv,
            });

            await paymentMethod.initDatabaseConfiguration(
              PaymentProviderType.MOLLIE
            );

            paymentProviders.push(paymentMethod);
          } else if (paymentProvider.type === 'no-charge') {
            const paymentMethod = new NeverChargePaymentProvider({
              id: paymentProvider.id,
              prisma,
              kv,
            });

            await paymentMethod.initDatabaseConfiguration(
              PaymentProviderType.NO_CHARGE
            );

            paymentProviders.push(paymentMethod);
          } else {
            throw new Error(
              `Unknown payment provider type defined: ${(paymentProvider as any).type}`
            );
          }
        }

        return { paymentProviders };
      },
      inject: [ConfigService, PrismaClient, KvTtlCacheService],
      global: true,
    }),
    PaymentsModule,
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
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );
        configFile.general.sessionTTLDays;
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const sessionTTLDays =
          configFile.general.sessionTTLDays ?
            configFile.general.sessionTTLDays
          : 7;
        const sessionTTL = MS_PER_DAY * sessionTTLDays;
        const jwtSecretKey =
          config.get('JWT_SECRET_KEY') || 'development-secret-key';
        const hostURL = config.get('HOST_URL') || 'http://localhost:4000';
        const websiteURL = config.get('WEBSITE_URL') || 'http://localhost:3000';

        if (
          process.env.NODE_ENV === 'production' &&
          jwtSecretKey === 'development-secret-key'
        ) {
          console.warn(
            'WARNING: Using default JWT secret key in production environment!'
          );
        }

        return {
          sessionTTL,
          jwtSecretKey,
          hostURL,
          websiteURL,
        };
      },
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
          websiteURL: config.get('WEBSITE_URL') || 'http://localhost:3000',
        };
      },
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
      imports: [ConfigModule, PrismaModule, KvTtlCacheModule],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );
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
            targetSymbol: '?',
          },
        };
      },
      inject: [ConfigService],
    }),
    SubscriptionModule,
    UpgradeSubscriptionModule,
    NavigationModule,
    TagModule,
    EventsImportModule.registerAsync({
      useFactory: (
        agendaBasel: AgendaBaselService,
        kulturZueri: KulturZueriService
      ) => [agendaBasel, kulturZueri],
      inject: [AgendaBaselService, KulturZueriService],
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    HealthModule,
    SystemInfoModule,
    HotAndTrendingModule.registerAsync({
      imports: [
        GoogleAnalyticsModule.registerAsync({
          imports: [PrismaModule, KvTtlCacheModule],
          inject: [PrismaClient, KvTtlCacheService],
          useFactory: async (prisma: PrismaClient, kv: KvTtlCacheService) => {
            const dbConfig = new GoogleAnalyticsDbConfig(
              prisma,
              kv,
              'google-analytics'
            );
            await dbConfig.initDatabaseConfiguration();
            return dbConfig;
          },
        }),
      ],
      useFactory: (datasource: GoogleAnalyticsService) => datasource,
      inject: [GoogleAnalyticsService],
    }),
    BannerApiModule,
    VersionInformationModule,
    CrowdfundingModule,
    ImportPeerArticleModule,
    URLAdapterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );

        const urlAdapter =
          configFile.general.urlAdapter === 'hauptstadt' ?
            new HauptstadtURLAdapter(config.getOrThrow('WEBSITE_URL'))
          : new URLAdapter(config.getOrThrow('WEBSITE_URL'));

        return urlAdapter;
      },
      inject: [ConfigService],
    }),
    MediaAdapterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );
        const internalUrl = config.get('MEDIA_SERVER_INTERNAL_URL');
        const token = config.getOrThrow('MEDIA_SERVER_TOKEN');

        return new NovaMediaAdapter(
          config.getOrThrow('MEDIA_SERVER_URL'),
          token,
          { quality: configFile.mediaServer.quality ?? 0.8 },
          internalUrl ? internalUrl : undefined
        );
      },
      inject: [ConfigService],
    }),
    PaywallModule,
  ],
  exports: ['SYSTEM_INFO_KEY'],
  providers: [
    {
      provide: 'SYSTEM_INFO_KEY',
      useFactory: (config: ConfigService) => {
        return config.get('SYSTEM_INFO_KEY');
      },
      inject: [ConfigService],
    },
    // System info key provider
  ],
})
export class AppModule {}
