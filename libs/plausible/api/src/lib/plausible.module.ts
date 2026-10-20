import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import {
  PLAUSIBLE_CLIENT_OPTIONS,
  PlausibleService,
} from './plausible.service';
import { PlausibleDbConfig } from './plausible-db-config';
import { PrismaModule } from '@wepublish/nest-modules';
import { ArticleModule } from '@wepublish/article/api';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';

export type PlausibleOptionsFactory = {
  createPlausibleOptions(): Promise<PlausibleDbConfig> | PlausibleDbConfig;
};

export interface PlausibleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<PlausibleOptionsFactory>;
  useClass?: Type<PlausibleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<PlausibleDbConfig> | PlausibleDbConfig;
  inject?: any[];
}

@Module({
  imports: [PrismaModule, ArticleModule, KvTtlCacheModule],
  providers: [PlausibleService],
  exports: [PlausibleService],
})
export class PlausibleModule {
  public static register(configProvider: PlausibleDbConfig): DynamicModule {
    return {
      module: PlausibleModule,
      providers: [
        {
          provide: PLAUSIBLE_CLIENT_OPTIONS,
          useValue: configProvider,
        },
      ],
    };
  }

  public static registerAsync(options: PlausibleAsyncOptions): DynamicModule {
    return {
      module: PlausibleModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: PlausibleAsyncOptions
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
    options: PlausibleAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: PLAUSIBLE_CLIENT_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: PLAUSIBLE_CLIENT_OPTIONS,
      useFactory: async (optionsFactory: PlausibleOptionsFactory) =>
        await optionsFactory.createPlausibleOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
