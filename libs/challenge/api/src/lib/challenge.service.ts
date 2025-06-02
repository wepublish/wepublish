import {Inject, Injectable, Optional} from '@nestjs/common'
import {ChallengeProvider} from './challenge-provider.interface'
import {Challenge, ChallengeValidationProps, ChallengeValidationReturn} from './challenge.model'

export const CHALLENGE_PROVIDER = 'CHALLENGE_PROVIDER'

@Injectable()
export class ChallengeService {
  constructor(
    @Inject(CHALLENGE_PROVIDER)
    private readonly challengeProvider: ChallengeProvider
  ) {}

  async generateChallenge(): Promise<Challenge> {
    return this.challengeProvider.generateChallenge()
  }

  async validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn> {
    return this.challengeProvider.validateChallenge(props)
  }
}
