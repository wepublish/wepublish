import { ModuleAsyncOptions } from '@wepublish/utils/api';

interface TurnstileChallengeConfig {
  type: 'turnstile';
  id: string;
}

interface AlgebraicChallengeConfig {
  type: 'algebraic';
  secret: string;
  validTime?: number;
  width?: number;
  height?: number;
  background?: string;
  noise?: number;
  minValue?: number;
  maxValue?: number;
  operandAmount?: number;
  operandTypes?: string[];
  mode?: string;
  targetSymbol?: string;
}

type ChallengeConfig = TurnstileChallengeConfig | AlgebraicChallengeConfig;

export const CHALLENGE_MODULE_OPTIONS = 'CHALLENGE_MODULE_OPTIONS';

export interface ChallengeModuleOptions {
  challenge: ChallengeConfig;
}

export type ChallengeModuleAsyncOptions =
  ModuleAsyncOptions<ChallengeModuleOptions>;
