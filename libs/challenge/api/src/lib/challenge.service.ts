import { Injectable } from '@nestjs/common';
import { ChallengeProvider } from './challenge-provider.interface';
import {
  Challenge,
  ChallengeValidationProps,
  ChallengeValidationReturn,
} from './challenge.model';

@Injectable()
export class ChallengeService {
  constructor(private challengeProvider: ChallengeProvider) {}

  async generateChallenge(): Promise<Challenge> {
    return this.challengeProvider.generateChallenge();
  }

  async validateChallenge(
    props: ChallengeValidationProps
  ): Promise<ChallengeValidationReturn> {
    return this.challengeProvider.validateChallenge(props);
  }
}
