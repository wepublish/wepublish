export type Challenge = {
  type: CaptchaType;
  challengeID: string;
  challenge: string | null;
  validUntil: Date | null;
};
export type ChallengeValidationProps = {
  challengeID?: string;
  solution: number | string;
};

export type ChallengeValidationReturn = {
  result: string;
  message: string;
  valid: boolean;
};

export enum CaptchaType {
  Algebraic = 'Algebraic',
  CfTurnstile = 'CfTurnstile',
}

export interface ChallengeProvider {
  generateChallenge(): Promise<Challenge>;
  validateChallenge(
    props: ChallengeValidationProps
  ): Promise<ChallengeValidationReturn>;
}
