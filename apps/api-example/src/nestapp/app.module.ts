import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { GqlModuleOptions, GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaClient } from '@prisma/client';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ActionModule } from '@wepublish/action/api';
import { AuditLogModule } from '@wepublish/audit-log/api';
import { V0Module } from '@wepublish/ai/api';
import { NovaMediaAdapter } from '@wepublish/api';
import { ArticleModule, HotAndTrendingModule } from '@wepublish/article/api';
import { AuthenticationModule } from '@wepublish/authentication/api';
import { AuthorModule } from '@wepublish/author/api';
import { BannerApiModule } from '@wepublish/banner/api';
import { BlockContentModule } from '@wepublish/block-content/api';
import { ChallengeModule } from '@wepublish/challenge/api';
import { ChangelogModule } from '@wepublish/changelog/api';
import { CommentModule } from '@wepublish/comments/api';
import { ConsentModule } from '@wepublish/consent/api';
import { CrowdfundingModule } from '@wepublish/crowdfunding/api';
import { DocumentModule } from '@wepublish/document/api';
import { EventModule } from '@wepublish/event/api';
import {
  AgendaBaselService,
  EventsImportModule,
  KulturZueriService,
} from '@wepublish/event/import/api';
import { ExternalAppsModule } from '@wepublish/external-apps/api';
import {
  GoogleAnalyticsDbConfig,
  GoogleAnalyticsModule,
  GoogleAnalyticsService,
} from '@wepublish/google-analytics/api';
import { HealthModule } from '@wepublish/health';
import { MediaAdapterModule } from '@wepublish/image/api';
import {
  GraphqlResponseCacheModule,
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { MailsModule } from '@wepublish/mail/api';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import {
  DashboardModule,
  InvoiceModule,
  MembershipModule,
  RenewalMailModule,
  SubscriptionModule,
  UpgradeSubscriptionModule,
  GoodieModule,
  DiscountCodeModule,
} from '@wepublish/membership/api';
import { NavigationModule } from '@wepublish/navigation/api';
import {
  ApiModule,
  HauptstadtURLAdapter,
  PrismaModule,
  URLAdapter,
  URLAdapterModule,
  WepublishSiteURLAdapter,
} from '@wepublish/nest-modules';
import { PageModule } from '@wepublish/page/api';
import { PaymentMethodModule, PaymentsModule } from '@wepublish/payment/api';
import { PaywallModule } from '@wepublish/paywall/api';
import { PeerModule } from '@wepublish/peering/api';
import { ImportPeerArticleModule } from '@wepublish/peering/api/import';
import { PermissionModule } from '@wepublish/permissions/api';
import { PhraseModule } from '@wepublish/phrase/api';
import { PollModule } from '@wepublish/poll/api';
import { GraphQLRichText, SlateToPmMigrator } from '@wepublish/richtext/api';
import { SessionModule } from '@wepublish/session/api';
import { OneModule } from '@wepublish/one/api';
import {
  SettingModule,
  SettingName,
  WebsiteSettingsModule,
} from '@wepublish/settings/api';
import { StatsModule } from '@wepublish/stats/api';
import { SystemInfoModule } from '@wepublish/system-info';
import { TagModule } from '@wepublish/tag/api';
import { TrackingPixelsModule } from '@wepublish/tracking-pixel/api';
import { UserSubscriptionModule } from '@wepublish/user-subscription/api';
import { UserModule } from '@wepublish/user/api';
import { generateJWT } from '@wepublish/utils/api';
import { VersionInformationModule } from '@wepublish/versionInformation/api';
import { readConfig } from '../readConfig';
import {
  ProviderRegistryModule,
  ProviderRegistryService,
} from '@wepublish/provider-registry/api';
import { reconcileProviderRegistry } from './reconcile-provider-registry';

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
          introspection:
            process.env.NODE_ENV !== 'production' &&
            configFile.general.apolloIntrospection,
          graphiql: configFile.general.apolloPlayground,
          allowBatchedHttpRequests: true,
          inheritResolversFromInterfaces: true,
          csrfPrevention: false,
        } as ApolloDriverConfig & GqlModuleOptions;
      },
    }),
    KvTtlCacheModule,
    GraphqlResponseCacheModule,
    V0Module.registerAsync({
      imports: [PrismaModule, KvTtlCacheModule],
    }),
    AuthorModule,
    PrismaModule,
    ProviderRegistryModule.forRootAsync({
      imports: [ConfigModule, PrismaModule],
      inject: [ConfigService, PrismaClient],
      useFactory: (config: ConfigService, prisma: PrismaClient) => () =>
        reconcileProviderRegistry(prisma, config.get('CONFIG_FILE_PATH')),
    }),
    MailsModule.registerAsync({
      imports: [ConfigModule, PrismaModule, KvTtlCacheModule],
      useFactory: async (
        config: ConfigService,
        prisma: PrismaClient,
        registry: ProviderRegistryService
      ) => {
        await registry.ensureLoaded();

        const jwtPrivateKey = (config.get('JWT_PRIVATE_KEY') || '').replace(
          /\\n/g,
          '\n'
        );
        const hostURL = config.get('HOST_URL') || 'http://localhost:4000';
        const websiteURL = config.get('WEBSITE_URL') || 'http://localhost:3000';

        const jwtExpiresSetting = await prisma.setting.findUnique({
          where: { name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN },
        });
        const jwtExpires =
          (jwtExpiresSetting?.value as number) ??
          parseInt(config.get('SEND_LOGIN_JWT_EXPIRES_MIN') ?? `${6 * 60}`);

        return {
          mailProvider: registry.mailProvider,
          jwtGenerator: (userId: string) =>
            generateJWT({
              id: userId,
              privateKey: jwtPrivateKey,
              issuer: hostURL,
              audience: websiteURL,
              expiresInMinutes: jwtExpires,
            }),
        };
      },
      inject: [ConfigService, PrismaClient, ProviderRegistryService],
      global: true,
    }),
    TrackingPixelsModule.registerAsync({
      useFactory: async (registry: ProviderRegistryService) => {
        await registry.ensureLoaded();
        return { trackingPixelProviders: registry.trackingPixelProviders };
      },
      inject: [ProviderRegistryService],
    }),
    PaymentMethodModule.registerAsync({
      useFactory: async (registry: ProviderRegistryService) => {
        await registry.ensureLoaded();
        return { paymentProviders: registry.paymentProviders };
      },
      inject: [ProviderRegistryService],
      global: true,
    }),
    PaymentsModule,
    MemberPlanModule,
    ApiModule,
    MembershipModule,
    InvoiceModule,
    GoodieModule,
    DiscountCodeModule,
    DashboardModule,
    RenewalMailModule,
    AuthenticationModule,

    // Register SessionModule after AuthenticationModule
    // to ensure proper order of dependencies
    SessionModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const sessionTTL = MS_PER_DAY * 7;
        const jwtPrivateKey = (config.get('JWT_PRIVATE_KEY') || '').replace(
          /\\n/g,
          '\n'
        );
        const jwtPublicKey = (config.get('JWT_PUBLIC_KEY') || '').replace(
          /\\n/g,
          '\n'
        );
        const hostURL = config.getOrThrow('HOST_URL');
        const websiteURL = config.getOrThrow('WEBSITE_URL');

        if (
          process.env.NODE_ENV === 'production' &&
          (!jwtPrivateKey || !jwtPublicKey)
        ) {
          console.error(
            'WARNING: JWT_PRIVATE_KEY or JWT_PUBLIC_KEY not set in production environment!'
          );
        }

        return {
          sessionTTL,
          jwtPrivateKey,
          jwtPublicKey,
          hostURL,
          websiteURL,
        };
      },
    }),

    OneModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        oneURL: config.get('WEP_ONE_URL') || '',
        hostURL: config.get('HOST_URL') || 'http://localhost:4000',
      }),
    }),
    PermissionModule,
    AuditLogModule,
    ChangelogModule,
    ConsentModule,
    DocumentModule,
    StatsModule,
    SettingModule,
    ExternalAppsModule,
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
      useFactory: async (registry: ProviderRegistryService) => {
        await registry.ensureLoaded();
        return { challengeProvider: registry.challengeProvider };
      },
      inject: [ProviderRegistryService],
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
      imports: [ConfigModule, PrismaModule],
      useFactory: async (config: ConfigService, prisma: PrismaClient) => {
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );

        let urlAdapter: URLAdapter;
        if (configFile.general.urlAdapter === 'hauptstadt') {
          urlAdapter = new HauptstadtURLAdapter(
            config.getOrThrow('WEBSITE_URL'),
            prisma
          );
        } else if (configFile.general.urlAdapter === 'wepublish-site') {
          urlAdapter = new WepublishSiteURLAdapter();
        } else {
          urlAdapter = new URLAdapter(config.getOrThrow('WEBSITE_URL'));
        }

        return urlAdapter;
      },
      inject: [ConfigService, PrismaClient],
    }),
    MediaAdapterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const configFile = await readConfig(
          config.getOrThrow('CONFIG_FILE_PATH')
        );
        const internalUrl = config.get('MEDIA_SERVER_INTERNAL_URL');
        const jwtPrivateKey = config
          .getOrThrow<string>('JWT_PRIVATE_KEY')
          .replace(/\\n/g, '\n');

        return new NovaMediaAdapter(
          config.getOrThrow('MEDIA_SERVER_URL'),
          jwtPrivateKey,
          config.getOrThrow('HOST_URL'),
          { quality: configFile.mediaServer.quality ?? 1 },
          internalUrl ? internalUrl : undefined
        );
      },
      inject: [ConfigService],
    }),
    PaywallModule,
    WebsiteSettingsModule,
  ],
  exports: ['SYSTEM_INFO_KEY'],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: 'SYSTEM_INFO_KEY',
      useFactory: (config: ConfigService) => {
        return config.get('SYSTEM_INFO_KEY');
      },
      inject: [ConfigService],
    },
    SlateToPmMigrator,
  ],
})
export class AppModule {}
