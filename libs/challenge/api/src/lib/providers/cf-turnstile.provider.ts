import {
  CaptchaType,
  Challenge,
  ChallengeValidationProps,
  ChallengeValidationReturn,
} from '../challenge.model';
import { ChallengeProvider } from '../challenge-provider.interface';
import FormData from 'form-data';
import fetch from 'node-fetch';

export class CFTurnstileProvider implements ChallengeProvider {
  constructor(
    private turnstileSecretKey: string,
    private turnstileSiteKey: string
  ) {}

  private testing = false;

  async generateChallenge(testing = false): Promise<Challenge> {
    this.testing = testing;

    return {
      type: CaptchaType.CfTurnstile,
      challengeID: this.turnstileSiteKey,
      challenge: undefined,
      validUntil: undefined,
    };
  }

  async validateChallenge(
    props: ChallengeValidationProps
  ): Promise<ChallengeValidationReturn> {
    const token = props.solution;
    const formData = new FormData();
    formData.append('secret', this.turnstileSecretKey);
    formData.append('response', `${token}`);

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const result = await fetch(url, {
      body: formData as any,
      method: 'POST',
    });

    const outcome = await result.json();

    if (outcome.success || this.testing) {
      return {
        result: 'valid',
        message: 'Challenge is valid.',
        valid: true,
      };
    }

    return {
      result: 'invalid',
      message: 'The provided Turnstile token is not valid!',
      valid: false,
    };
  }
}
