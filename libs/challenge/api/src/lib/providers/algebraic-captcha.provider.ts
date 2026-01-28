import {
  CaptchaType,
  Challenge,
  ChallengeValidationProps,
  ChallengeValidationReturn,
} from '../challenge.model';
import { createHash } from 'crypto';
import { AlgebraicCaptcha } from 'algebraic-captcha';
import { IParams } from 'algebraic-captcha/build/i-params';
import { ChallengeProvider } from '../challenge-provider.interface';

type Store = {
  [key: string]: number;
};

export interface TestingChallengeAnswer {
  challengeID: string;
  challengeSolution: string;
}

export class AlgebraicCaptchaChallenge implements ChallengeProvider {
  // Hash list to prevent replay attacks
  private validHashes: Store;
  // counter to prevent reuse!
  private counter: number;
  // Random seed to make hash unpredictable
  readonly challengeSecret: string;
  // Defines how long a challenge is valid
  readonly challengeValidTime: number;
  private captchaLib: AlgebraicCaptcha;

  // FOR TESTING PURPOSES ONLY
  // saves one pair of full text challengeID and answer
  private testingChallengeAnswer?: TestingChallengeAnswer;

  constructor(
    challengeSecret: string,
    challengeValidTime: number,
    algebraicCaptchaOptions: IParams
  ) {
    this.challengeSecret = challengeSecret;
    this.challengeValidTime = challengeValidTime * 1000;
    this.validHashes = {};
    this.counter = 0;
    this.captchaLib = new AlgebraicCaptcha(algebraicCaptchaOptions);
  }

  composeHashSecret(answer: number | string, time: number, counter: number) {
    return `${this.challengeSecret};${time};${answer};${counter}`;
  }

  createHash(challengeSecret: string) {
    return createHash('sha256').update(challengeSecret).digest('base64');
  }

  cleanupOldHashes() {
    if (this.counter % 100 !== 0) return;
    const cleanDate = new Date().getTime() - this.challengeValidTime;
    for (const hash in this.validHashes) {
      if (this.validHashes[hash] < cleanDate) delete this.validHashes[hash];
    }
  }

  async generateChallenge(testing = false): Promise<Challenge> {
    const time = new Date().getTime();
    const { image, answer } = await this.captchaLib.generateCaptcha();
    const challengeSecret = this.composeHashSecret(answer, time, this.counter);
    const hash = this.createHash(challengeSecret);
    this.validHashes[hash] = time;
    const challengeID = Buffer.from(
      `${time};${hash};${this.counter++}`,
      'utf-8'
    ).toString('base64');

    // for TESTING PURPOSES ONLY. Save one answer in clear text
    if (testing) {
      this.testingChallengeAnswer = {
        challengeID,
        challengeSolution: answer.toString(),
      };
    }
    return {
      type: CaptchaType.Algebraic,
      challengeID,
      challenge: image,
      validUntil: new Date(time + this.challengeValidTime),
    };
  }

  async validateChallenge(
    props: ChallengeValidationProps
  ): Promise<ChallengeValidationReturn> {
    // Decode challengeID
    const decoded = Buffer.from(props.challengeID ?? '', 'base64').toString(
      'utf-8'
    );
    const secret = decoded.split(';');
    const time = parseInt(secret[0]);
    const hash = secret[1];
    const counter = secret[2] as unknown as number;

    // Protect against replay attacks
    if (!this.validHashes[hash]) {
      return {
        result: 'reuse',
        message: 'Challenge has been reused!',
        valid: false,
      };
    }
    delete this.validHashes[hash];

    // Protection against solve in advance attacks
    if (new Date().getTime() > time + this.challengeValidTime)
      return {
        result: 'expired',
        message: 'Challenge has expired!',
        valid: false,
      };

    // Check if challenge has been solved correctly
    const challengeSecret = this.composeHashSecret(
      props.solution,
      time,
      counter
    );
    this.cleanupOldHashes();
    if (this.createHash(challengeSecret) === hash)
      return {
        result: 'valid',
        message: 'Challenge is valid.',
        valid: true,
      };
    return {
      result: 'invalid',
      message: 'Challenge is not solved correctly!',
      valid: false,
    };
  }

  /**
   * FOR TESTING PURPOSES ONLY
   * Getting one pair of id and answer in clear text.
   */
  public getTestingChallengeAnswer(): TestingChallengeAnswer | undefined {
    return this.testingChallengeAnswer;
  }
}
