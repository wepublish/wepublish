import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, UserLoginCode } from '@prisma/client';
import { PurlData, PurlOrigin, PurlProvider } from '@wepublish/mail/api';
import { SecretCrypto, SettingName } from '@wepublish/settings/api';
import { renderQrSvg } from '@wepublish/utils/api';
import { addDays } from 'date-fns';
import {
  LOGIN_CODE_MODULE_OPTIONS,
  LoginCodeModuleOptions,
} from './login-code-module-options';
import { InvalidLoginCodeError } from './login-code.errors';
import {
  buildPurl,
  deriveLoginCodeKey,
  formatLoginCode,
  generateLoginCode,
  hashLoginCode,
  normalizeLoginCode,
} from './login-code.util';

const DEFAULT_MAX_USES = 5;
const DEFAULT_VALID_DAYS = 90;
const MIN_REMAINING_DAYS_FOR_REUSE = 14;

export type IssuedLoginCode = {
  record: UserLoginCode;
  canonical: string;
};

@Injectable()
export class LoginCodeService implements PurlProvider {
  private readonly crypto = new SecretCrypto();
  private readonly hmacKey: Buffer;

  constructor(
    private prisma: PrismaClient,
    @Inject(LOGIN_CODE_MODULE_OPTIONS) private options: LoginCodeModuleOptions
  ) {
    this.hmacKey = deriveLoginCodeKey(process.env['APP_SECRET_KEY'] ?? '');
  }

  private async setting(name: SettingName, fallback: number) {
    const setting = await this.prisma.setting.findUnique({ where: { name } });
    const value = Number(setting?.value);

    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private activeWhere(now: Date) {
    return {
      revokedAt: null,
      usesRemaining: { gt: 0 },
      expiresAt: { gt: now },
    };
  }

  async getOrIssue(userId: string, issuedBy: string): Promise<IssuedLoginCode> {
    const now = new Date();
    const reusable = await this.prisma.userLoginCode.findFirst({
      where: {
        userId,
        revokedAt: null,
        usesRemaining: { gt: 0 },
        expiresAt: { gt: addDays(now, MIN_REMAINING_DAYS_FOR_REUSE) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (reusable) {
      return {
        record: reusable,
        canonical: this.crypto.decrypt(reusable.codeEncrypted),
      };
    }

    return this.issue(userId, issuedBy);
  }

  private async issue(
    userId: string,
    issuedBy: string
  ): Promise<IssuedLoginCode> {
    const [maxUses, validDays] = await Promise.all([
      this.setting(SettingName.LOGIN_CODE_MAX_USES, DEFAULT_MAX_USES),
      this.setting(SettingName.LOGIN_CODE_VALID_DAYS, DEFAULT_VALID_DAYS),
    ]);
    const canonical = generateLoginCode();

    const record = await this.prisma.userLoginCode.create({
      data: {
        userId,
        codeHash: hashLoginCode(canonical, this.hmacKey),
        codeEncrypted: this.crypto.encrypt(canonical) as string,
        expiresAt: addDays(new Date(), validDays),
        maxUses,
        usesRemaining: maxUses,
        issuedBy,
      },
    });

    return { record, canonical };
  }

  async purlFor(userId: string, origin: PurlOrigin): Promise<PurlData> {
    const { canonical } = await this.getOrIssue(userId, origin);
    const purl = buildPurl(this.options.websiteURL, canonical);

    return {
      purl,
      purlCode: formatLoginCode(canonical),
      purlQr: renderQrSvg(purl),
    };
  }

  async verify(rawCode: string) {
    const canonical = normalizeLoginCode(rawCode);

    if (!canonical) {
      throw new InvalidLoginCodeError();
    }

    const record = await this.prisma.userLoginCode.findUnique({
      where: { codeHash: hashLoginCode(canonical, this.hmacKey) },
      include: { user: true },
    });

    if (
      !record ||
      record.revokedAt ||
      record.usesRemaining <= 0 ||
      record.expiresAt <= new Date()
    ) {
      throw new InvalidLoginCodeError();
    }

    return record;
  }

  async consume(id: string) {
    const now = new Date();
    const { count } = await this.prisma.userLoginCode.updateMany({
      where: { id, ...this.activeWhere(now) },
      data: { usesRemaining: { decrement: 1 }, lastUsedAt: now },
    });

    if (count !== 1) {
      throw new InvalidLoginCodeError();
    }
  }

  async statusFor(userId: string) {
    return this.prisma.userLoginCode.findFirst({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(userId: string, revokedBy: string) {
    const { count } = await this.prisma.userLoginCode.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedBy },
    });

    return count;
  }

  async reissue(userId: string, issuedBy: string) {
    await this.revoke(userId, issuedBy);
    const { record, canonical } = await this.issue(userId, issuedBy);

    return {
      status: record,
      code: formatLoginCode(canonical),
      purl: buildPurl(this.options.websiteURL, canonical),
    };
  }
}
