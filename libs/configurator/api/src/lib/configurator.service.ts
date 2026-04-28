import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { MailProviderType, PrismaClient } from '@prisma/client';
import { MailProviderSettingsService } from '@wepublish/settings/api';
import { createRemoteJWKSet, decodeJwt, jwtVerify, JWTPayload } from 'jose';
import { randomBytes } from 'crypto';

const NONCE_TTL_MS = 5 * 60_000;
const JTI_TTL_MS = 10 * 60_000;
const JWKS_CACHE_MAX_AGE_MS = 10 * 60_000;
const PAYLOAD_VERSION = 1;

type SecretsPayload = JWTPayload & {
  v?: number;
  trigger?: 'signal' | 'scheduled';
  nonce?: string;
  medium_name?: string;
  environment?: 'production' | 'staging';
  secrets?: Record<string, unknown>;
  settings?: Record<string, string>;
};

@Injectable()
export class ConfiguratorService {
  private readonly logger = new Logger(ConfiguratorService.name);

  private readonly configuratorUrl: string | undefined;
  private readonly expectedAudience: string | undefined;
  private readonly mediumName: string | undefined;
  private readonly environment: 'production' | 'staging' | undefined;

  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private readonly pendingNonces = new Map<string, number>();
  private readonly seenJtis = new Map<string, number>();

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaClient,
    private readonly moduleRef: ModuleRef
  ) {
    this.configuratorUrl = config.get<string>('CONFIGURATOR_URL');
    this.expectedAudience = config.get<string>('API_URL');
    this.mediumName = config.get<string>('APP_NAME');
    this.environment = config.get<'production' | 'staging'>('APP_ENVIRONMENT');

    if (this.configuratorUrl) {
      this.jwks = createRemoteJWKSet(
        new URL(`${this.configuratorUrl}/.well-known/jwks.json`),
        { cacheMaxAge: JWKS_CACHE_MAX_AGE_MS }
      );
    }
  }

  triggerBootSignal(): void {
    this.logger.log(
      `Boot signal check: CONFIGURATOR_URL=${this.configuratorUrl ?? '(unset)'} APP_NAME=${this.mediumName ?? '(unset)'} APP_ENVIRONMENT=${this.environment ?? '(unset)'} API_URL=${this.expectedAudience ?? '(unset)'}`
    );

    if (!this.configuratorUrl) {
      this.logger.log(
        'CONFIGURATOR_URL not set — skipping configurator boot signal'
      );
      return;
    }
    if (!this.mediumName || !this.environment) {
      this.logger.warn(
        'APP_NAME or APP_ENVIRONMENT not set — skipping configurator boot signal'
      );
      return;
    }

    // Fire-and-forget: the actual secrets arrive out-of-band at the receiver
    // endpoint, so there's no reason to block app startup on this round-trip.
    void this.requestSecretsOnBoot(this.mediumName, this.environment).catch(
      err => {
        const e = err as Error & { cause?: unknown };
        const causeMsg = e.cause instanceof Error ? `: ${e.cause.message}` : '';
        this.logger.error(
          `Failed to signal configurator on boot at ${this.configuratorUrl}: ${e.message}${causeMsg}`
        );
      }
    );
  }

  async requestSecretsOnBoot(
    mediumName: string,
    environment: 'production' | 'staging'
  ): Promise<void> {
    if (!this.configuratorUrl) {
      throw new Error('CONFIGURATOR_URL is not configured');
    }

    const nonce = this.issueNonce();
    const res = await fetch(`${this.configuratorUrl}/secrets/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medium_name: mediumName,
        environment,
        nonce,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.status !== 202) {
      throw new Error(
        `Configurator signal failed with status ${res.status}: ${await res.text().catch(() => '')}`
      );
    }

    this.logger.log(
      `Signaled configurator for ${mediumName}/${environment}; awaiting push`
    );
  }

  async receiveSecrets(token: string): Promise<void> {
    if (!this.configuratorUrl || !this.jwks) {
      throw new UnauthorizedException('Configurator not configured');
    }
    if (!this.expectedAudience) {
      throw new UnauthorizedException('API_URL not configured');
    }

    let payload: SecretsPayload;
    try {
      const result = await jwtVerify(token, this.jwks, {
        issuer: this.configuratorUrl,
        audience: this.expectedAudience,
        clockTolerance: 30,
      });
      payload = result.payload as SecretsPayload;
    } catch (err) {
      const actual = this.safeDecodeClaims(token);
      this.logger.warn(
        `Rejected configurator token: ${(err as Error).message} ` +
          `(expected iss=${this.configuratorUrl} aud=${this.expectedAudience}; ` +
          `got iss=${actual?.iss} aud=${JSON.stringify(actual?.aud)})`
      );
      throw new UnauthorizedException('Invalid configurator token');
    }

    if (payload.v !== PAYLOAD_VERSION) {
      this.logger.warn(
        `Rejected configurator token: unsupported v=${payload.v}`
      );
      throw new UnauthorizedException('Unsupported payload version');
    }

    if (!payload.jti) {
      throw new UnauthorizedException('Missing jti');
    }

    if (this.isDuplicate(payload.jti)) {
      this.logger.log(
        `Dropping duplicate configurator token jti=${payload.jti}`
      );
      return;
    }

    if (payload.trigger === 'signal') {
      if (!payload.nonce || !this.consumeNonce(payload.nonce)) {
        throw new UnauthorizedException('Unknown or expired nonce');
      }
    } else if (payload.trigger !== 'scheduled') {
      throw new UnauthorizedException(`Unknown trigger: ${payload.trigger}`);
    }

    await this.applyConfig(payload);
  }

  private async applyConfig(payload: SecretsPayload): Promise<void> {
    this.logger.log(
      `Received configurator push: trigger=${payload.trigger} medium=${payload.medium_name} env=${payload.environment} jti=${payload.jti}`
    );
    this.logger.log(
      `Configurator payload: ${JSON.stringify(
        { secrets: payload.secrets, settings: payload.settings },
        null,
        2
      )}`
    );

    // Spec shows `settings` nested under `secrets`, reference impl treats it
    // as a top-level claim — accept either.
    const nestedSettings = payload.secrets?.['settings'] as
      | Record<string, string>
      | undefined;
    const nextWepOneUrl =
      payload.settings?.['WEP_ONE_URL'] ?? nestedSettings?.['WEP_ONE_URL'];

    if (nextWepOneUrl && nextWepOneUrl !== process.env['WEP_ONE_URL']) {
      const previous = process.env['WEP_ONE_URL'];
      process.env['WEP_ONE_URL'] = nextWepOneUrl;
      this.logger.log(
        `WEP_ONE_URL updated from configurator: "${previous ?? ''}" -> "${nextWepOneUrl}"`
      );
    }

    const mail = payload.secrets?.['mail'] as
      | { provider?: string; api_key?: string }
      | undefined;
    if (mail?.provider === 'mailchimp' && mail.api_key) {
      await this.overwriteMailchimpApiKey(mail.api_key);
    }
  }

  private async overwriteMailchimpApiKey(apiKey: string): Promise<void> {
    const providers = await this.prisma.settingMailProvider.findMany({
      where: { type: MailProviderType.MAILCHIMP },
      select: { id: true },
    });

    if (providers.length === 0) {
      this.logger.log(
        'Configurator sent mailchimp api_key but no mailchimp mail provider is configured'
      );
      return;
    }

    // Resolve lazily because MailProviderSettingsService is REQUEST-scoped
    // (scope propagation from its PrimeDataLoader @Inject). If we injected it
    // in the constructor, this whole service would become REQUEST-scoped and
    // the boot-time signal would never run.
    const mailProviderSettings = await this.moduleRef.resolve(
      MailProviderSettingsService,
      undefined,
      { strict: false }
    );

    for (const { id } of providers) {
      await mailProviderSettings.updateMailProviderSetting({
        id,
        apiKey,
      });
      this.logger.log(`Updated mailchimp apiKey for mail provider id=${id}`);
    }
  }

  private safeDecodeClaims(token: string): JWTPayload | null {
    try {
      return decodeJwt(token);
    } catch {
      return null;
    }
  }

  private issueNonce(): string {
    this.pruneNonces();
    const nonce = randomBytes(16).toString('hex');
    this.pendingNonces.set(nonce, Date.now() + NONCE_TTL_MS);
    return nonce;
  }

  private consumeNonce(nonce: string): boolean {
    this.pruneNonces();
    const expiresAt = this.pendingNonces.get(nonce);
    if (!expiresAt || expiresAt < Date.now()) {
      return false;
    }
    this.pendingNonces.delete(nonce);
    return true;
  }

  private pruneNonces(): void {
    const now = Date.now();
    for (const [nonce, expiresAt] of this.pendingNonces) {
      if (expiresAt < now) this.pendingNonces.delete(nonce);
    }
  }

  private isDuplicate(jti: string): boolean {
    const now = Date.now();
    for (const [k, exp] of this.seenJtis) {
      if (exp < now) this.seenJtis.delete(k);
    }
    if (this.seenJtis.has(jti)) return true;
    this.seenJtis.set(jti, now + JTI_TTL_MS);
    return false;
  }
}
