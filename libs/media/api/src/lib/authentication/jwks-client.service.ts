import { Inject, Injectable, Logger } from '@nestjs/common';
import { importJWK, type KeyLike, type JWK } from 'jose';

export const JWKS_CLIENT_OPTIONS = Symbol('JWKS_CLIENT_OPTIONS');

export type JwksClientConfig = {
  apiUrl: string;
};

@Injectable()
export class JwksClientService {
  private readonly logger = new Logger(JwksClientService.name);
  private publicKey: KeyLike | null = null;
  private fetchedAt = 0;
  private fetchPromise: Promise<KeyLike> | null = null;
  private readonly cacheTtlMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(@Inject(JWKS_CLIENT_OPTIONS) private config: JwksClientConfig) {}

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  async getPublicKey(): Promise<KeyLike> {
    if (this.publicKey && Date.now() - this.fetchedAt < this.cacheTtlMs) {
      return this.publicKey;
    }

    if (!this.fetchPromise) {
      this.fetchPromise = this.fetchAndCacheKey();
    }

    return this.fetchPromise;
  }

  private async fetchAndCacheKey(): Promise<KeyLike> {
    try {
      const jwksUrl = `${this.config.apiUrl}/.well-known/jwks.json`;
      this.logger.log(`Fetching JWKS from ${jwksUrl}`);

      const response = await fetch(jwksUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch JWKS: ${response.status} ${response.statusText}`
        );
      }

      const jwks = (await response.json()) as { keys: JWK[] };

      if (!jwks.keys?.length) {
        throw new Error('No keys found in JWKS response');
      }

      const key = await importJWK(jwks.keys[0], 'EdDSA');
      this.publicKey = key as KeyLike;
      this.fetchedAt = Date.now();
      this.fetchPromise = null;

      this.logger.log('Successfully cached public key from JWKS endpoint');
      return this.publicKey;
    } catch (error) {
      this.fetchPromise = null;

      // Fall back to stale key if available, so a temporary API outage
      // doesn't take down the media server
      if (this.publicKey) {
        this.logger.warn(
          'JWKS refresh failed, continuing with stale key',
          (error as Error).message
        );
        return this.publicKey;
      }

      throw error;
    }
  }
}
