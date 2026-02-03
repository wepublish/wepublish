import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    private mailContext: MailContext
  ) {}

  async createSessionWithEmailAndPassword(email: string, password: string) {
    const user =
      await this.userAuthenticationService.authenticateUserWithEmailAndPassword(
        email,
        password
      );

    if (!user) throw new InvalidCredentialsError();
    if (!user.active) throw new NotActiveError();

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

    const { createdAt } = await this.prisma.session.create({
      data: {
        token,
        expiresAt,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return {
      user,
      token,
      createdAt,
      expiresAt,
    };
  }

  async sendWebsiteLogin(email: string) {
    Validator.login.parse({ email });

    const user = await this.userService.getUserByEmail(email);

    if (!user) {
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

  async sendJWTLogin(email: string) {
    email = email.toLowerCase();
    await Validator.login.parse({ email });

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: unselectPassword,
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} was not found.`);
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
    ).toISOString();

    const token = this.jwtService.generateJWT({ id: userId, expiresInMinutes });

    return {
      token,
      expiresAt,
    };
  }

  async createJWTForWebsiteLogin(userId: string) {
    const expiresInMinutes = 1;

    const expiresAt = new Date(
      new Date().getTime() + expiresInMinutes * 60 * 1000
    ).toISOString();

    const token = this.jwtService.generateJWT({ id: userId, expiresInMinutes });

    return {
      token,
      expiresAt,
    };
  }
}
