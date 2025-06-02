import {DynamicModule, Module, Provider, Type} from '@nestjs/common'
import {CHALLENGE_PROVIDER, ChallengeService} from './challenge.service'
import {ChallengeResolver} from './challenge.resolver'
import {AlgebraicCaptchaChallenge} from './providers/algebraic-captcha.provider'
import {CFTurnstileProvider} from './providers/cf-turnstile.provider'
import {ChallengeProvider} from './challenge-provider.interface'

export const CHALLENGE_MODULE_OPTIONS = 'CHALLENGE_MODULE_OPTIONS'

interface TurnstileChallengeConfig {
  type: 'turnstile'
  secret: string
  siteKey: string
}

interface AlgebraicChallengeConfig {
  type: 'algebraic'
  secret: string
  validTime?: number
  width?: number
  height?: number
  background?: string
  noise?: number
  minValue?: number
  maxValue?: number
  operandAmount?: number
  operandTypes?: string[]
  mode?: string
  targetSymbol?: string
}

type ChallengeConfig = TurnstileChallengeConfig | AlgebraicChallengeConfig

export interface ChallengeModuleOptions {
  challenge: ChallengeConfig
}

export interface ChallengeModuleAsyncOptions {
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>
  useFactory: (...args: any[]) => Promise<ChallengeModuleOptions> | ChallengeModuleOptions
  inject?: any[]
}

@Module({
  providers: [
    {
      provide: CHALLENGE_MODULE_OPTIONS,
      useValue: {challenge: {type: 'algebraic', secret: 'default-secret'}}
    },
    ChallengeService,
    ChallengeResolver
  ],
  exports: [ChallengeService]
})
export class ChallengeModule {
  static registerAsync(options: ChallengeModuleAsyncOptions): DynamicModule {
    return {
      module: ChallengeModule,
      imports: options.imports || [],
      providers: [
        this.createAsyncOptionsProvider(options),
        {
          provide: CHALLENGE_PROVIDER,
          useFactory: (moduleOptions: ChallengeModuleOptions): ChallengeProvider => {
            const config = moduleOptions.challenge

            switch (config.type) {
              case 'turnstile':
                return new CFTurnstileProvider(config.secret, config.siteKey)

              case 'algebraic':
                const algebraicConfig = config
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
                    targetSymbol: algebraicConfig.targetSymbol
                  }
                )

              default:
                const exhaustiveCheck: never = config
                throw new Error(`Unsupported challenge type: ${(exhaustiveCheck as any).type}`)
            }
          },
          inject: [CHALLENGE_MODULE_OPTIONS]
        },
        ChallengeService,
        ChallengeResolver
      ],
      exports: [ChallengeService]
    }
  }

  private static createAsyncOptionsProvider(options: ChallengeModuleAsyncOptions): Provider {
    if (!options.useFactory) {
      throw new Error('useFactory is required for registerAsync')
    }

    return {
      provide: CHALLENGE_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || []
    }
  }
}
