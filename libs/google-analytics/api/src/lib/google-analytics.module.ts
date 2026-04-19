import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import {
  GA_CLIENT_OPTIONS,
  GoogleAnalyticsService,
} from './google-analytics.service';
import { GoogleAnalyticsDbConfig } from './google-analytics-db-config';
import { PrismaModule } from '@wepublish/nest-modules';
import { ArticleModule } from '@wepublish/article/api';

export type GoogleAnalyticsOptionsFactory = {
  createGoogleAnalyticsOptions():
    | Promise<GoogleAnalyticsDbConfig>
    | GoogleAnalyticsDbConfig;
};

export interface GoogleAnalyticsAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<GoogleAnalyticsOptionsFactory>;
  useClass?: Type<GoogleAnalyticsOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<GoogleAnalyticsDbConfig> | GoogleAnalyticsDbConfig;
  inject?: any[];
}

@Module({
  imports: [PrismaModule, ArticleModule],
  providers: [GoogleAnalyticsService],
  exports: [GoogleAnalyticsService],
})
export class GoogleAnalyticsModule {
  public static register(
    configProvider: GoogleAnalyticsDbConfig
  ): DynamicModule {
    return {
      module: GoogleAnalyticsModule,
      providers: [
        {
          provide: GA_CLIENT_OPTIONS,
          useValue: configProvider,
        },
      ],
    };
  }

  public static registerAsync(
    options: GoogleAnalyticsAsyncOptions
  ): DynamicModule {
    return {
      module: GoogleAnalyticsModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: GoogleAnalyticsAsyncOptions
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: GoogleAnalyticsAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: GA_CLIENT_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: GA_CLIENT_OPTIONS,
      useFactory: async (optionsFactory: GoogleAnalyticsOptionsFactory) =>
        await optionsFactory.createGoogleAnalyticsOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
