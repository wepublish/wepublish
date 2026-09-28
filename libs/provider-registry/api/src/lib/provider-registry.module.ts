import { HttpModule } from '@nestjs/axios';
import {
  DynamicModule,
  FactoryProvider,
  Global,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PROVIDER_SETTINGS_CHANGED } from '@wepublish/settings/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ProviderRegistryResolver } from './provider-registry.resolver';
import {
  PROVIDER_REGISTRY_BOOTSTRAP,
  ProviderRegistryBootstrap,
  ProviderRegistryService,
} from './provider-registry.service';

export type ProviderRegistryModuleAsyncOptions = {
  imports?: ModuleMetadata['imports'];
  inject?: FactoryProvider['inject'];
  useFactory: (
    ...args: never[]
  ) => ProviderRegistryBootstrap | Promise<ProviderRegistryBootstrap>;
};

@Global()
@Module({
  imports: [PrismaModule, KvTtlCacheModule, HttpModule],
  providers: [
    ProviderRegistryService,
    ProviderRegistryResolver,
    {
      provide: PROVIDER_SETTINGS_CHANGED,
      useExisting: ProviderRegistryService,
    },
  ],
  exports: [ProviderRegistryService, PROVIDER_SETTINGS_CHANGED],
})
export class ProviderRegistryModule {
  static forRootAsync(
    options: ProviderRegistryModuleAsyncOptions
  ): DynamicModule {
    return {
      module: ProviderRegistryModule,
      global: true,
      imports: [
        PrismaModule,
        KvTtlCacheModule,
        HttpModule,
        ...(options.imports ?? []),
      ],
      providers: [
        {
          provide: PROVIDER_REGISTRY_BOOTSTRAP,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        ProviderRegistryService,
        ProviderRegistryResolver,
        {
          provide: PROVIDER_SETTINGS_CHANGED,
          useExisting: ProviderRegistryService,
        },
      ],
      exports: [ProviderRegistryService, PROVIDER_SETTINGS_CHANGED],
    };
  }
}
