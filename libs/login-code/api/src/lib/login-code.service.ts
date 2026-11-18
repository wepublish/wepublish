import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, UserLoginCode } from '@prisma/client';
import {
  EMPTY_PURL_DATA,
  PurlData,
  PurlOrigin,
  PurlProvider,
} from '@wepublish/mail/api';
import { grantsOnlyReaderAccess } from '@wepublish/permissions';
import { addPredefinedPermissions } from '@wepublish/permissions/api';
import { SecretCrypto, SettingName } from '@wepublish/settings/api';
import { renderQrSvg } from '@wepublish/utils/api';
import { addDays } from 'date-fns';
import {
  LOGIN_CODE_MODULE_OPTIONS,
  LoginCodeModuleOptions,
} from './login-code-module-options';
import {
  InvalidLoginCodeError,
  LoginCodeDisabledError,
  LoginCodeNotAllowedError,
} from './login-code.errors';
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
const REVOKED_FOR_STAFF = 'system:staff-role';

type RoleWithPermissions = { id: string; permissionIDs: string[] };

const grantsMoreThanReaderAccess = (roles: RoleWithPermissions[]) =>
  !grantsOnlyReaderAccess(
    roles.map(addPredefinedPermissions).flatMap(role => role.permissionIDs)
  );

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

  /** Login codes are opt-in: each medium switches them on in the settings. */
  async isEnabled() {
    const setting = await this.prisma.setting.findUnique({
      where: { name: SettingName.LOGIN_CODE_ENABLED },
    });

    return setting?.value === true;
  }

  private async assertEnabled() {
    if (!(await this.isEnabled())) {
      throw new LoginCodeDisabledError();
    }
  }

  /**
   * Staff never hold a login code: a code session carries every permission of
   * its account, and a code travels on paper. Reader access through a role
   * (reading past the paywall) does not make an account staff.
   */
  private async mayHoldLoginCode({ roleIDs }: { roleIDs: string[] }) {
    if (!roleIDs.length) {
      return true;
    }

    const roles = await this.prisma.userRole.findMany({
      where: { id: { in: roleIDs } },
    });

    return !grantsMoreThanReaderAccess(roles);
  }

  private async assertMayHoldLoginCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleIDs: true },
    });

    if (!user || !(await this.mayHoldLoginCode(user))) {
      throw new LoginCodeNotAllowedError();
    }
  }

  private activeWhere(now: Date) {
    return {
      revokedAt: null,
      usesRemaining: { gt: 0 },
      expiresAt: { gt: now },
    };
  }

  async getOrIssue(userId: string, issuedBy: string): Promise<IssuedLoginCode> {
    await this.assertMayHoldLoginCode(userId);

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
    if (!(await this.isEnabled())) {
      return EMPTY_PURL_DATA;
    }

    let canonical: string;

    try {
      ({ canonical } = await this.getOrIssue(userId, origin));
    } catch (error) {
      if (error instanceof LoginCodeNotAllowedError) {
        return EMPTY_PURL_DATA;
      }

      throw error;
    }

    const purl = buildPurl(this.options.websiteURL, canonical);

    return {
      purl,
      purlCode: formatLoginCode(canonical),
      purlQr: renderQrSvg(purl),
    };
  }

  async verify(rawCode: string) {
    await this.assertEnabled();

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

    if (!(await this.mayHoldLoginCode(record.user))) {
      // Given a role after the code was issued. Answered like an unknown code,
      // so the code does not reveal that its holder is staff.
      await this.revoke(record.userId, REVOKED_FOR_STAFF);

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

  /** After a person's roles changed: staff lose their codes right away. */
  async revokeIfStaff(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleIDs: true },
    });

    if (user && !(await this.mayHoldLoginCode(user))) {
      await this.revoke(userId, REVOKED_FOR_STAFF);
    }
  }

  /**
   * After a role's permissions changed: if it now grants more than reader
   * access, everyone holding it is staff and loses their codes, in one query.
   */
  async revokeForRole(roleId: string) {
    const role = await this.prisma.userRole.findUnique({
      where: { id: roleId },
    });

    if (!role || !grantsMoreThanReaderAccess([role])) {
      return;
    }

    await this.prisma.userLoginCode.updateMany({
      where: { revokedAt: null, user: { roleIDs: { has: roleId } } },
      data: { revokedAt: new Date(), revokedBy: REVOKED_FOR_STAFF },
    });
  }

  async reissue(userId: string, issuedBy: string) {
    await this.assertEnabled();
    await this.assertMayHoldLoginCode(userId);
    await this.revoke(userId, issuedBy);
    const { record, canonical } = await this.issue(userId, issuedBy);

    return {
      status: record,
      code: formatLoginCode(canonical),
      purl: buildPurl(this.options.websiteURL, canonical),
    };
  }
}
