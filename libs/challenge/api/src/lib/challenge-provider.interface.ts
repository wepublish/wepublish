import {
  Challenge,
  ChallengeValidationProps,
  ChallengeValidationReturn,
} from './challenge.model';

export abstract class ChallengeProvider {
  abstract generateChallenge(): Promise<Challenge>;

  abstract validateChallenge(
    props: ChallengeValidationProps
  ): Promise<ChallengeValidationReturn>;
}
