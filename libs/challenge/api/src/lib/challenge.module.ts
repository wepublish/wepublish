import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { ChallengeResolver } from './challenge.resolver';
import { AlgebraicCaptchaChallenge } from './providers/algebraic-captcha.provider';
import { CFTurnstileProvider } from './providers/cf-turnstile.provider';
import { ChallengeProvider } from './challenge-provider.interface';
import {
  ChallengeModuleAsyncOptions,
  ChallengeModuleOptions,
} from './challenge-module-options';
import { createAsyncOptionsProvider } from '@wepublish/utils/api';
import { PrismaService } from '@wepublish/nest-modules';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { ChallengeProvider as EnumChallengeProvider } from '@prisma/client';

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
  if (challenge.type === 'turnstile') {
    const challengeProvider = new CFTurnstileProvider(challenge.id, prisma, kv);
    await challengeProvider.initDatabaseConfiguration(
      challenge.id,
      EnumChallengeProvider.TURNSTILE,
      prisma
    );
    return challengeProvider;
  }

  if (challenge.type === 'algebraic') {
    const algebraicConfig = challenge;
    return new AlgebraicCaptchaChallenge(
      algebraicConfig.secret,
      algebraicConfig.validTime || 600, // default 10 minutes
      {
        width: algebraicConfig.width,
        height: algebraicConfig.height,
        background: algebraicConfig.background,
        noise: algebraicConfig.noise,
        minValue: algebraicConfig.minValue,
        maxValue: algebraicConfig.maxValue,
        operandAmount: algebraicConfig.operandAmount,
        operandTypes: algebraicConfig.operandTypes,
        mode: algebraicConfig.mode,
        targetSymbol: algebraicConfig.targetSymbol,
      }
    );
  }

  const exhaustiveCheck: never = challenge;
  throw new Error(
    `Unsupported challenge type: ${(exhaustiveCheck as any).type}`
  );
};
