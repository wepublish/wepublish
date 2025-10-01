import {
  DynamicModule,
  Global,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import {
  HOT_AND_TRENDING_DATA_SOURCE,
  HotAndTrendingDataSource,
  HotAndTrendingResolver,
} from './hot-and-trending.resolver';
import { PrismaModule } from '@wepublish/nest-modules';

type HotAndTrendingDataSourceType = Type<HotAndTrendingDataSource>;

export type HotAndTrendingOptionsFactory = {
  createHotAndTrendingOptions():
    | Promise<HotAndTrendingDataSourceType>
    | HotAndTrendingDataSourceType;
};

export interface HotAndTrendingClientAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<HotAndTrendingOptionsFactory>;
  useClass?: Type<HotAndTrendingOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<HotAndTrendingDataSource> | HotAndTrendingDataSource;
  inject?: any[];
}

@Global()
@Module({
  imports: [PrismaModule],
  providers: [HotAndTrendingResolver],
  exports: [HOT_AND_TRENDING_DATA_SOURCE],
})
export class HotAndTrendingModule {
  public static register(config: HotAndTrendingDataSourceType): DynamicModule {
    return {
      module: HotAndTrendingModule,
      providers: [
        {
          provide: HOT_AND_TRENDING_DATA_SOURCE,
          useValue: config,
        },
      ],
    };
  }

  public static registerAsync(
    options: HotAndTrendingClientAsyncOptions
  ): DynamicModule {
    return {
      module: HotAndTrendingModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: HotAndTrendingClientAsyncOptions
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
    options: HotAndTrendingClientAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: HOT_AND_TRENDING_DATA_SOURCE,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: HOT_AND_TRENDING_DATA_SOURCE,
      useFactory: async (optionsFactory: HotAndTrendingOptionsFactory) =>
        await optionsFactory.createHotAndTrendingOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
