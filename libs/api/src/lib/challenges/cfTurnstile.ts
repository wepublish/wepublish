import {
  Challenge,
  ChallengeProvider,
  ChallengeValidationProps,
  ChallengeValidationReturn
} from './challengeProvider'

export class CfTurnstile implements ChallengeProvider {
  constructor(private turnstile_secret_key: string) {}

  async generateChallenge(testing = false): Promise<Challenge> {
    return {
      challengeID: 'not supported is turnstile!',
      challenge: null,
      validUntil: null
    }
  }
  async validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn> {
    if (props.challengeID) {
      throw new Error('Turnstile does not support challengeID pass only solution!')
    }

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
    if (outcome.success) {
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
