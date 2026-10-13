import { Inject, Injectable, Logger } from '@nestjs/common';
import { importJWK, type JWK } from 'jose';
import { ONE_URL_TOKEN } from './one.tokens';

const JWKS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OneJwksClientService {
  private readonly logger = new Logger(OneJwksClientService.name);
  private keys = new Map<string, CryptoKey>();
  private fallbackKey: CryptoKey | null = null;
  private fetchedAt = 0;
  private fetchPromise: Promise<void> | null = null;

  constructor(@Inject(ONE_URL_TOKEN) private oneURL: string) {}

  async getKey(kid?: string): Promise<CryptoKey> {
    const isFresh = Date.now() - this.fetchedAt < JWKS_CACHE_TTL_MS;
    const cached = kid ? this.keys.get(kid) : this.fallbackKey;

    if (isFresh && cached) {
      return cached;
    }

    await this.refresh();

    const key = (kid ? this.keys.get(kid) : null) ?? this.fallbackKey;

    if (!key) {
      throw new Error(`No key in One JWKS for kid ${kid ?? 'unspecified'}`);
    }

    return key;
  }

  private async refresh(): Promise<void> {
    if (!this.fetchPromise) {
      this.fetchPromise = this.fetchAndCache().finally(() => {
        this.fetchPromise = null;
      });
    }

    return this.fetchPromise;
  }

  private async fetchAndCache(): Promise<void> {
    const url = `${this.oneURL}/channel/jwks.json`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const jwks = (await response.json()) as { keys: JWK[] };

      if (!jwks.keys?.length) {
        throw new Error('no keys in JWKS response');
      }

      const imported = new Map<string, CryptoKey>();
      let fallback: CryptoKey | null = null;

      for (const jwk of jwks.keys) {
        const key = (await importJWK(jwk, 'EdDSA')) as CryptoKey;

        if (!fallback) {
          fallback = key;
        }

        if (jwk.kid) {
          imported.set(jwk.kid, key);
        }
      }

      this.keys = imported;
      this.fallbackKey = fallback;
      this.fetchedAt = Date.now();
    } catch (error) {
      if (this.fallbackKey) {
        this.logger.warn(
          `JWKS refresh from ${url} failed, continuing with cached key: ${
            (error as Error).message
          }`
        );
        return;
      }

      throw error;
    }
  }
}
