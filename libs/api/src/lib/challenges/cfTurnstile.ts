import {
  CaptchaType,
  Challenge,
  ChallengeProvider,
  ChallengeValidationProps,
  ChallengeValidationReturn
} from './challengeProvider'

export class CfTurnstile implements ChallengeProvider {
  constructor(private turnstile_secret_key: string) {}
  private testing = false

  async generateChallenge(testing = false): Promise<Challenge> {
    this.testing = testing
    return {
      type: CaptchaType.CfTurnstile,
      challengeID: null,
      challenge: null,
      validUntil: null
    }
  }
  async validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn> {
    const token = props.solution
    const formData = new FormData()
    formData.append('secret', this.turnstile_secret_key)
    formData.append('response', `${token}`)

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    const result = await fetch(url, {
      body: formData,
      method: 'POST'
    })
    const outcome = await result.json()
    if (outcome.success || this.testing) {
      return {
        result: 'valid',
        message: 'Challenge is valid.',
        valid: true
      }
    }
    return {
      result: 'invalid',
      message: 'The provided Turnstile token is not valid!',
      valid: false
    }
  }
}