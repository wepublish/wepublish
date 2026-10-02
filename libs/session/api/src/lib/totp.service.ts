import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import * as OTPAuth from 'otpauth';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const appName = process.env.APP_NAME || 'local';
const capitalizedAppName = appName.charAt(0).toUpperCase() + appName.slice(1);
const TOTP_ISSUER_CMS = `We.Publish CMS - ${capitalizedAppName}`;
const TOTP_ISSUER_WEBSITE = capitalizedAppName;
const TOTP_ALGORITHM = 'SHA1';
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const USED_CODE_TTL_MS = 90 * 1000; // 90 seconds (3 TOTP periods)

const failedAttemptsName = (userId: string) => `totp-failures:${userId}`;
const usedStepName = (userId: string, step: number) =>
  `totp-used:${userId}:${step}`;

@Injectable()
export class TotpService {
  private encryptionKey: Buffer;

  // Rate limiting: track failed TOTP attempts per user
  private failedAttempts = new Map<
    string,
    { count: number; lockedUntil?: number }
  >();

  // Replay protection: track used TOTP time steps per user
  private usedSteps = new Map<string, { step: number; usedAt: number }[]>();

  constructor(
    private prisma: PrismaClient,
    private sessionCache: SessionCacheInvalidator,
    private kv: KvTtlCacheService
  ) {
    const appSecretKey = process.env.APP_SECRET_KEY;

    if (!appSecretKey) {
      throw new Error(
        'APP_SECRET_KEY is not set. It is required for TOTP secret encryption.'
      );
    }

    // Derive a 32-byte AES-256 key from APP_SECRET_KEY
    this.encryptionKey = createHash('sha256').update(appSecretKey).digest();
  }

  private encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, dataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(dataHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  generateSecret(
    email: string,
    website?: boolean
  ): { secret: string; uri: string } {
    const totp = new OTPAuth.TOTP({
      issuer: website ? TOTP_ISSUER_WEBSITE : TOTP_ISSUER_CMS,
      label: email,
      algorithm: TOTP_ALGORITHM,
      digits: TOTP_DIGITS,
      period: TOTP_PERIOD,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    return {
      secret: totp.secret.base32,
      uri: totp.toString(),
    };
  }

  private async reserveAttempt(userId: string) {
    const now = Date.now();
    const known = this.failedAttempts.get(userId);

    if (known?.lockedUntil && now < known.lockedUntil) {
      const remainingMin = Math.ceil((known.lockedUntil - now) / 60000);
      throw new BadRequestException(
        `Too many failed attempts. Account locked for ${remainingMin} more minute(s).`
      );
    }

    const entry =
      known && !known.lockedUntil ?
        known
      : { count: 0, lockedUntil: undefined };
    entry.count++;
    const lockedHere = entry.count > MAX_FAILED_ATTEMPTS;

    if (lockedHere) {
      entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    this.failedAttempts.set(userId, entry);

    const attempts = await this.kv.increment(
      failedAttemptsName(userId),
      LOCKOUT_DURATION_MS
    );

    if (
      lockedHere ||
      (attempts !== undefined && attempts > MAX_FAILED_ATTEMPTS)
    ) {
      throw new BadRequestException(
        `Too many failed attempts. Account locked for ${
          LOCKOUT_DURATION_MS / 60000
        } more minute(s).`
      );
    }
  }

  private async clearFailedAttempts(userId: string) {
    this.failedAttempts.delete(userId);
    await this.kv.forgetCount(failedAttemptsName(userId));
  }

  private async markStepUsed(userId: string, step: number) {
    const now = Date.now();
    const steps = (this.usedSteps.get(userId) ?? []).filter(
      used => now - used.usedAt < USED_CODE_TTL_MS
    );
    const usedHere = steps.some(used => used.step === step);

    if (!usedHere) {
      steps.push({ step, usedAt: now });
      this.usedSteps.set(userId, steps);
    }

    if (
      usedHere ||
      (await this.kv.claim(usedStepName(userId, step), USED_CODE_TTL_MS)) ===
        false
    ) {
      throw new BadRequestException(
        'This verification code has already been used. Wait for a new code.'
      );
    }
  }

  verifyToken(secret: string, token: string): boolean {
    return this.matchingStep(secret, token) !== undefined;
  }

  private matchingStep(secret: string, token: string): number | undefined {
    const totp = new OTPAuth.TOTP({
      algorithm: TOTP_ALGORITHM,
      digits: TOTP_DIGITS,
      period: TOTP_PERIOD,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const delta = totp.validate({ token, window: 1 });

    return delta === null ? undefined : totp.counter() + delta;
  }

  async setupTotp(userId: string, email: string, website?: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true },
    });

    if (user?.totpEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled. Reset it first to generate a new setup.'
      );
    }

    const { secret, uri } = this.generateSecret(email, website);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: this.encrypt(secret) },
    });
    await this.sessionCache.invalidate();

    return { secret, uri };
  }

  async enableTotp(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.totpEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled.'
      );
    }

    if (!user.totpSecret) {
      throw new BadRequestException(
        'No TOTP secret found. Please generate a setup first.'
      );
    }

    await this.reserveAttempt(userId);
    const step = this.matchingStep(this.decrypt(user.totpSecret), token);

    if (step === undefined) {
      throw new BadRequestException('Invalid verification code.');
    }

    await this.markStepUsed(userId, step);
    await this.clearFailedAttempts(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
    await this.sessionCache.invalidate();

    return true;
  }

  async verifyUserTotp(userId: string, token: string): Promise<boolean> {
    await this.reserveAttempt(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true },
    });

    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw new BadRequestException(
        'Two-factor authentication is not enabled.'
      );
    }

    const step = this.matchingStep(this.decrypt(user.totpSecret), token);

    if (step === undefined) {
      throw new BadRequestException('Invalid verification code.');
    }

    await this.markStepUsed(userId, step);
    await this.clearFailedAttempts(userId);
    return true;
  }

  async resetTotp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        totpEnabled: false,
      },
    });
    await this.sessionCache.invalidate();

    return true;
  }
}
