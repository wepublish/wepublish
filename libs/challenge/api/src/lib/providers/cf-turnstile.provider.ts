import {
  CaptchaType,
  Challenge,
  ChallengeValidationProps,
  ChallengeValidationReturn,
} from '../challenge.model';
import { ChallengeProvider } from '../challenge-provider.interface';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { PrismaClient, SettingChallengeProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

class TurnstileConfig {
  private readonly ttl = 60;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async load(): Promise<SettingChallengeProvider | null> {
    return this.prisma.settingChallengeProvider.findUnique({
      where: {
        id: this.id,
      },
    });
  }

  async getFromCache(): Promise<SettingChallengeProvider | null> {
    return this.kv.getOrLoad<SettingChallengeProvider | null>(
      `turnstile:settings:${this.id}`,
      () => this.load(),
      this.ttl
    );
  }

  async getConfig(): Promise<SettingChallengeProvider | null> {
    return await this.getFromCache();
  }
}

export class CFTurnstileProvider extends ChallengeProvider {
  constructor(
    private readonly id: string,
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService
  ) {
    super();
  }

  private testing = false;

  async generateChallenge(testing = false): Promise<Challenge> {
    this.testing = testing;
    const config = await new TurnstileConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();

    if (!testing && !config?.siteKey) {
      throw new Error('Turnstile configuration mismatch');
    }

    return {
      type: CaptchaType.CfTurnstile,
      challengeID: config?.siteKey ?? '',
      challenge: undefined,
      validUntil: undefined,
    };
  }

  async validateChallenge(
    props: ChallengeValidationProps
  ): Promise<ChallengeValidationReturn> {
    const config = await new TurnstileConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();

    if (!this.testing && !config?.secret) {
      throw new Error('Turnstile configuration mismatch');
    }

    const token = props.solution;
    const formData = new FormData();
    formData.append('secret', config?.secret);
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
