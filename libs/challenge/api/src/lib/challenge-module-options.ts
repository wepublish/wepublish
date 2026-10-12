import { ModuleAsyncOptions } from '@wepublish/utils/api';
import { ChallengeProvider } from './challenge-provider.interface';

export const CHALLENGE_MODULE_OPTIONS = 'CHALLENGE_MODULE_OPTIONS';

export interface ChallengeModuleOptions {
  challengeProvider: ChallengeProvider;
}

export type ChallengeModuleAsyncOptions =
  ModuleAsyncOptions<ChallengeModuleOptions>;
