import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { ChallengeResolver } from './challenge.resolver';
import { CFTurnstileProvider } from './providers/cf-turnstile.provider';
import { ChallengeProvider } from './challenge-provider.interface';
import {
  ChallengeModuleAsyncOptions,
  ChallengeModuleOptions,
} from './challenge-module-options';
import { createAsyncOptionsProvider } from '@wepublish/utils/api';
import { PrismaService } from '@wepublish/nest-modules';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { ChallengeProviderType } from '@prisma/client';

export const CHALLENGE_MODULE_OPTIONS = 'CHALLENGE_MODULE_OPTIONS';

@Module({
  imports: [],
  providers: [],
})
export class ChallengeModule {
  static registerAsync(options: ChallengeModuleAsyncOptions): DynamicModule {
    return {
      module: ChallengeModule,
      global: options.global,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncProviders(options),
        ChallengeService,
        ChallengeResolver,
      ],
      exports: [ChallengeService],
    };
  }

  private static createAsyncProviders(
    options: ChallengeModuleAsyncOptions
  ): Provider[] {
    return [
      createAsyncOptionsProvider<ChallengeModuleOptions>(
        CHALLENGE_MODULE_OPTIONS,
        options
      ),
      {
        provide: ChallengeProvider,
        useFactory: (
          challengeModuleOptions: ChallengeModuleOptions,
          prisma: PrismaService,
          kv: KvTtlCacheService
        ) =>
          createChallengeProviderFromConfig(
            challengeModuleOptions.challenge,
            prisma,
            kv
          ),
        inject: [CHALLENGE_MODULE_OPTIONS, PrismaService, KvTtlCacheService],
      },
    ];
  }
}

const createChallengeProviderFromConfig = async (
  challenge: ChallengeModuleOptions['challenge'],
  prisma: PrismaService,
  kv: KvTtlCacheService
) => {
  const challengeProvider = new CFTurnstileProvider(challenge.id, prisma, kv);
  await challengeProvider.initDatabaseConfiguration(
    challenge.id,
    ChallengeProviderType.TURNSTILE,
    prisma
  );
  return challengeProvider;
};
