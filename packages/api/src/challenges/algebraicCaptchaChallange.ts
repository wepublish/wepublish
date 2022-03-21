import {
  Challenge,
  ChallengeProvider,
  ChallengeValidationProps,
  ChallengeValidationReturn
} from './challengeProvider'
import {createHash} from 'crypto'
import {AlgebraicCaptcha} from 'algebraic-captcha'
import {IParams} from 'algebraic-captcha/build/i-params'

type Store = {
  [key: string]: number
}

export class AlgebraicCaptchaChallenge implements ChallengeProvider {
  readonly challengeSecret: string
  readonly challengeValidTime: number
  private validHashes: Store
  private counter: number
  private captchaLib: AlgebraicCaptcha

  constructor(
    challengeSecret: string,
    challengeValidTime: number,
    algebraicCaptchaOptions: IParams
  ) {
    this.challengeSecret = challengeSecret
    this.challengeValidTime = challengeValidTime * 1000
    // Hash list to prevent replay attacks
    this.validHashes = {}
    // counter to prevent reuse!
    this.counter = 0
    this.captchaLib = new AlgebraicCaptcha(algebraicCaptchaOptions)
  }

  composeHashSecret(answer: number, time: number, counter: number) {
    return `${this.challengeSecret};${time};${answer};${counter}`
  }

  createHash(challengeSecret: string) {
    return createHash('sha256').update(challengeSecret).digest('base64')
  }

  cleanupOldHashes() {
    if (Math.floor(Math.random() * 20) !== 1) return
    const cleanDate = new Date().getTime() - this.challengeValidTime
    for (const hash in this.validHashes) {
      if (this.validHashes[hash] < cleanDate) delete this.validHashes[hash]
    }
  }

  async generateChallenge(): Promise<Challenge> {
    const time = new Date().getTime()
    const {image, answer} = await this.captchaLib.generateCaptcha()
    const challengeSecret = this.composeHashSecret(answer, time, this.counter)
    const hash = this.createHash(challengeSecret)
    this.validHashes[hash] = time
    return {
      challengeID: Buffer.from(`${time};${hash};${this.counter++}`, 'utf-8').toString('base64'),
      challenge: image,
      validUntil: new Date(time + this.challengeValidTime).toISOString()
    }
  }

  async validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn> {
    const decoded = Buffer.from(props.challengeID, 'base64').toString('utf-8')
    const secret = decoded.split(';')
    const time = parseInt(secret[0])
    const hash = secret[1]
    const counter = (secret[2] as unknown) as number

    // Prevent user from using challenge multiple times
    if (!this.validHashes[hash]) {
      return {
        result: 'reuse',
        msg: 'Challenge has been reused!',
        valid: false
      }
    }
    delete this.validHashes[hash]

    // Prevent user from solving challenges in advance
    if (new Date().getTime() > time + this.challengeValidTime)
      return {
        result: 'expired',
        msg: 'Challenge has expired!',
        valid: false
      }

    // Check if challenge has been solved correctly
    const challengeSecret = this.composeHashSecret(props.solve, time, counter)
    this.cleanupOldHashes()
    if (this.createHash(challengeSecret) === hash)
      return {
        result: 'valid',
        msg: 'Challenge is valid.',
        valid: true
      }
    return {
      result: 'invalid',
      msg: 'Challenge is not solved correctly!',
      valid: false
    }
  }
}
