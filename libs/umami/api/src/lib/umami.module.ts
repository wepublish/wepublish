import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { UMAMI_CLIENT_OPTIONS, UmamiService } from './umami.service';
import { UmamiDbConfig } from './umami-db-config';
import { PrismaModule } from '@wepublish/nest-modules';
import { ArticleModule } from '@wepublish/article/api';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';

export type UmamiOptionsFactory = {
  createUmamiOptions(): Promise<UmamiDbConfig> | UmamiDbConfig;
};

export interface UmamiAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<UmamiOptionsFactory>;
  useClass?: Type<UmamiOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<UmamiDbConfig> | UmamiDbConfig;
  inject?: any[];
}

@Module({
  imports: [PrismaModule, ArticleModule, KvTtlCacheModule],
  providers: [UmamiService],
  exports: [UmamiService],
})
export class UmamiModule {
  public static register(configProvider: UmamiDbConfig): DynamicModule {
    return {
      module: UmamiModule,
      providers: [
        {
          provide: UMAMI_CLIENT_OPTIONS,
          useValue: configProvider,
        },
      ],
    };
  }

  public static registerAsync(options: UmamiAsyncOptions): DynamicModule {
    return {
      module: UmamiModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: UmamiAsyncOptions): Provider[] {
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
    options: UmamiAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: UMAMI_CLIENT_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: UMAMI_CLIENT_OPTIONS,
      useFactory: async (optionsFactory: UmamiOptionsFactory) =>
        await optionsFactory.createUmamiOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
