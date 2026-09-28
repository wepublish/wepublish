import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { ChallengeResolver } from './challenge.resolver';
import { ChallengeProvider } from './challenge-provider.interface';
import {
  ChallengeModuleAsyncOptions,
  ChallengeModuleOptions,
} from './challenge-module-options';
import { createAsyncOptionsProvider } from '@wepublish/utils/api';

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
        useFactory: (challengeModuleOptions: ChallengeModuleOptions) =>
          challengeModuleOptions.challengeProvider,
        inject: [CHALLENGE_MODULE_OPTIONS],
      },
    ];
  }
}
