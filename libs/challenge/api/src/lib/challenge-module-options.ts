import { ModuleAsyncOptions } from '@wepublish/utils/api';

interface TurnstileChallengeConfig {
  type: 'turnstile';
  id: string;
}

interface HCaptchaChallengeConfig {
  type: 'hcaptcha';
  id: string;
}

type ChallengeConfig = TurnstileChallengeConfig | HCaptchaChallengeConfig;

export const CHALLENGE_MODULE_OPTIONS = 'CHALLENGE_MODULE_OPTIONS';

export interface ChallengeModuleOptions {
  challenge: ChallengeConfig;
}

export type ChallengeModuleAsyncOptions =
  ModuleAsyncOptions<ChallengeModuleOptions>;
