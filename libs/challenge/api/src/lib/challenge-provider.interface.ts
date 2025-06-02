import {Challenge, ChallengeValidationProps, ChallengeValidationReturn} from './challenge.model'

export interface ChallengeProvider {
  generateChallenge(): Promise<Challenge>
  validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn>
}
