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
import { SecretCrypto } from '@wepublish/settings/api';

class TurnstileConfig {
  private readonly ttl = 21600; // 6h
  private readonly crypto = new SecretCrypto();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async load(): Promise<SettingChallengeProvider | null> {
    await this.prisma.settingChallengeProvider.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });
    const config = await this.prisma.settingChallengeProvider.findUnique({
      where: {
        id: this.id,
      },
    });

    if (!config) {
      return null;
    }

    let decryptedSecret: string | null = null;
    if (config?.secret) {
      try {
        decryptedSecret = this.crypto.decrypt(config.secret);
      } catch (e) {
        console.error(e);
        throw new Error(
          `Failed to decrypt secret for Challenge provider setting ${this.id}`
        );
      }
    }
    return {
      ...config,
      secret: decryptedSecret,
    };
  }

  async getFromCache(): Promise<SettingChallengeProvider | null> {
    return this.kv.getOrLoadNs<SettingChallengeProvider | null>(
      `settings:challenge`,
      `${this.id}`,
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
