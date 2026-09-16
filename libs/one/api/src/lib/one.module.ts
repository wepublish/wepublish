import {
  DynamicModule,
  InjectionToken,
  Module,
  Provider,
} from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { PrismaModule } from '@wepublish/nest-modules';
import { StatsModule } from '@wepublish/stats/api';
import { MediumStatsResolver } from './medium-stats.resolver';
import { OneChannelStateService } from './one-channel-state.service';
import { OneChannelStatusResolver } from './one-channel-status.resolver';
import { OneClientService } from './one-client.service';
import { OneHeartbeatService } from './one-heartbeat.service';
import { OneJwksClientService } from './one-jwks-client.service';
import {
  ONE_SCOPED_JWT_VERIFIER,
  OneScopedJwtGuard,
} from './one-scoped-jwt.guard';
import { OneTokenVerifier } from './one-token.verifier';
import {
  ONE_HOST_URL_TOKEN,
  ONE_URL_TOKEN,
  normaliseChannelUrl,
} from './one.tokens';

export interface OneModuleOptions {
  oneURL: string;
  hostURL: string;
}

export interface OneModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: never[]
  ) => Promise<OneModuleOptions> | OneModuleOptions;
  inject?: InjectionToken[];
}

@Module({})
export class OneModule {
  static registerAsync(options: OneModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: OneModule,
      imports: [PrismaModule, StatsModule, ...(options.imports || [])],
      providers: [
        ...this.createAsyncProviders(options),
        OneJwksClientService,
        OneTokenVerifier,
        OneScopedJwtGuard,
        OneChannelStateService,
        OneChannelStatusResolver,
        MediumStatsResolver,
        OneClientService,
        OneHeartbeatService,
        { provide: ONE_SCOPED_JWT_VERIFIER, useExisting: OneTokenVerifier },
      ],
      exports: [
        OneScopedJwtGuard,
        OneClientService,
        OneChannelStateService,
        ONE_SCOPED_JWT_VERIFIER,
      ],
    };
  }

  private static createAsyncProviders(
    options: OneModuleAsyncOptions
  ): Provider[] {
    return [
      {
        provide: ONE_URL_TOKEN,
        useFactory: async (...args: never[]) => {
          const config = await options.useFactory(...args);
          return normaliseChannelUrl(config.oneURL);
        },
        inject: options.inject || [],
      },
      {
        provide: ONE_HOST_URL_TOKEN,
        useFactory: async (...args: never[]) => {
          const config = await options.useFactory(...args);
          return normaliseChannelUrl(config.hostURL);
        },
        inject: options.inject || [],
      },
    ];
  }
}
