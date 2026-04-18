import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient, User, UserEvent } from '@prisma/client';
import { InvalidCredentialsError, NotActiveError } from './session.errors';
import nanoid from 'nanoid/generate';
import { UserAuthenticationService } from './user-authentication.service';
import { JwtAuthenticationService } from './jwt-authentication.service';
import { unselectPassword, UserSession } from '@wepublish/authentication/api';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { Validator } from './validator';
import { UserService } from '@wepublish/user/api';
import {
  FIFTEEN_MINUTES_IN_MILLISECONDS,
  logger,
  USER_PROPERTY_LAST_LOGIN_LINK_SEND,
} from '@wepublish/utils/api';
import { JwtService } from './jwt.service';
import { TotpService } from './totp.service';

const IDAlphabet =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const SESSION_TTL_TOKEN = 'SESSION_TTL_TOKEN';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaClient,
    @Inject(SESSION_TTL_TOKEN) private sessionTTL: number,
    private userAuthenticationService: UserAuthenticationService,
    private userService: UserService,
    private jwtAuthenticationService: JwtAuthenticationService,
    private jwtService: JwtService,
    private settingsService: SettingsService,
    private mailContext: MailContext,
    private totpService: TotpService
  ) {}

  /**
   * Checks if a given email requires TOTP during login.
   * Returns true if the user has TOTP enabled or if the user doesn't exist
   * (to prevent user enumeration - unknown emails look the same as TOTP users).
   * Returns false only for existing users without TOTP configured.
   */
  async checkLoginOtp(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase(), mode: 'insensitive' } },
      select: { totpEnabled: true },
    });

    if (!user) {
      return true;
    }

    return user.totpEnabled;
  }

  async createSessionWithEmailAndPassword(
    email: string,
    password: string,
    totpToken?: string
  ) {
    const user =
      await this.userAuthenticationService.authenticateUserWithEmailAndPassword(
        email,
        password
      );

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.active) {
      throw new NotActiveError();
    }

    if (user.totpEnabled) {
      // User has TOTP configured - require valid code to get a session.
      // No exceptions: password login without TOTP = no session.
      if (!totpToken) {
        throw new InvalidCredentialsError();
      }

      await this.totpService.verifyUserTotp(user.id, totpToken);
    }

    return this.createUserSession(user);
  }

  async createSessionWithJWT(jwt: string) {
    const user =
      await this.jwtAuthenticationService.authenticateUserWithJWT(jwt);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.active) {
      throw new NotActiveError();
    }

    if (user.totpEnabled) {
      // Users with 2FA must use password + TOTP to log in.
      // Email link login is disabled for them to prevent 2FA bypass.
      throw new BadRequestException(
        'Login links are not available for accounts with two-factor authentication. Please use your password and authenticator code.'
      );
    }

    return this.createUserSession(user);
  }

  async revokeSession(session: UserSession | null) {
    if (!session) {
      return false;
    }

    return !!(await this.prisma.session.delete({
      where: {
        token: session.token,
      },
    }));
  }

  async createUserSession(user: User) {
    const token = nanoid(IDAlphabet, 64);

    const expiresAt = new Date(Date.now() + this.sessionTTL);

    const [{ createdAt }] = await Promise.all([
      this.prisma.session.create({
        data: {
          token,
          expiresAt,
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      }),
    ]);

    return {
      user,
      token,
      createdAt,
      expiresAt,
      totpEnabled: user.totpEnabled,
    };
  }

  async sendWebsiteLogin(email: string) {
    Validator.login.parse({ email });

    const user = await this.userService.getUserByEmailWithPassword(email);

    if (!user) {
      return;
    }

    // Silently skip sending login link for users with 2FA enabled.
    // They must use password + TOTP. We don't reveal that 2FA is
    // the reason to prevent enumeration of 2FA-enabled accounts.
    if (user.totpEnabled) {
      return;
    }

    const lastSendTimeStamp = user.properties.find(
      property => property?.key === USER_PROPERTY_LAST_LOGIN_LINK_SEND
    );

    if (
      lastSendTimeStamp &&
      parseInt(lastSendTimeStamp.value) >
        Date.now() - FIFTEEN_MINUTES_IN_MILLISECONDS
    ) {
      logger('mutation.public').warn(
        'User with ID %s requested Login Link multiple times in 15 min time window',
        user.id
      );

      return email;
    }

    const resetPwdSetting = await this.settingsService.settingByName(
      SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN
    );

    const resetPwd =
      (resetPwdSetting?.value as number) ??
      parseInt(process.env.RESET_PASSWORD_JWT_EXPIRES_MIN ?? '');

    if (!resetPwd) {
      throw new Error('No value set for RESET_PASSWORD_JWT_EXPIRES_MIN');
    }

    const remoteTemplate = await this.mailContext.getUserTemplateName(
      UserEvent.LOGIN_LINK
    );

    await this.mailContext.sendMail({
      externalMailTemplateId: remoteTemplate,
      recipient: user,
      optionalData: {},
      mailType: mailLogType.UserFlow,
    });

    await this.userAuthenticationService.updateUserLastLoginLinkSend(user.id);
  }

  async sendPasswordResetEmail(email: string) {
    const validation = Validator.login.safeParse({ email });
    if (!validation.success) {
      throw new BadRequestException('Invalid email address.');
    }

    // Check if the PASSWORD_RESET template is configured
    const remoteTemplate = await this.mailContext.getUserTemplateName(
      UserEvent.PASSWORD_RESET,
      false
    );

    if (!remoteTemplate) {
      throw new BadRequestException(
        'Password reset is not configured. Please contact your administrator.'
      );
    }

    const user = await this.userService.getUserByEmailWithPassword(email);

    // Silently succeed if user doesn't exist (anti-enumeration)
    if (!user) {
      return email;
    }

    await this.mailContext.sendMail({
      externalMailTemplateId: remoteTemplate,
      recipient: user,
      optionalData: {
        resetToken: await this.jwtService.generateJWT({
          id: user.id,
          expiresInMinutes: 60, // 1 hour
          audience: 'password-reset',
        }),
      },
      mailType: mailLogType.UserFlow,
    });

    return email;
  }

  async resetPasswordWithToken(token: string, password: string) {
    let userId: string;
    try {
      userId = await this.jwtService.verifyJWT(token, 'password-reset');
    } catch {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    if (!userId) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    try {
      await this.userService.validatePassword(password);
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Password does not meet the requirements.'
      );
    }

    await this.userService.updateUserPassword(userId, password);

    return true;
  }

  async sendJWTLogin(email: string) {
    email = email.toLowerCase();
    await Validator.login.parse({ email });

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: unselectPassword,
    });

    if (!user) {
      return email;
    }

    const jwtExpiresSetting = await this.prisma.setting.findUnique({
      where: { name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN },
    });
    const jwtExpires =
      (jwtExpiresSetting?.value as number) ??
      parseInt(process.env['SEND_LOGIN_JWT_EXPIRES_MIN'] ?? '');

    if (!jwtExpires) {
      throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN');
    }

    const remoteTemplate = await this.mailContext.getUserTemplateName(
      UserEvent.LOGIN_LINK
    );

    await this.mailContext.sendMail({
      externalMailTemplateId: remoteTemplate,
      recipient: user,
      optionalData: {},
      mailType: mailLogType.UserFlow,
    });

    return email;
  }

  async createJWTForUser(userId: string, expiresInMinutes: number) {
    const TWO_YEARS_IN_MIN = 2 * 365 * 24 * 60;

    if (expiresInMinutes > TWO_YEARS_IN_MIN) {
      throw new BadRequestException(
        `ExpiresInMinutes: ${expiresInMinutes} is too far in the future.`
      );
    }

    const expiresAt = new Date(
      new Date().getTime() + expiresInMinutes * 60 * 1000
    );

    const token = await this.jwtService.generateJWT({
      id: userId,
      expiresInMinutes,
    });

    return {
      token,
      expiresAt,
    };
  }

  async createJWTForWebsiteLogin(userId: string) {
    const expiresInMinutes = 1;

    const expiresAt = new Date(
      new Date().getTime() + expiresInMinutes * 60 * 1000
    );

    const token = await this.jwtService.generateJWT({
      id: userId,
      expiresInMinutes,
    });

    return {
      token,
      expiresAt,
    };
  }
}
