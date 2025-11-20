import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SessionService } from './session.service';
import { UserService } from '@wepublish/user/api';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { MemberRegistrationInput } from './register.model';
import { Validator } from './validator';
import crypto from 'crypto';
import { UserEvent } from '@prisma/client';
import { logger } from '@wepublish/utils/api';

@Injectable()
export class RegisterService {
  constructor(
    readonly sessionService: SessionService,
    readonly userService: UserService,
    readonly mailContext: MailContext
  ) {}

  async registerMember({
    email,
    password,
    ...input
  }: Omit<MemberRegistrationInput, 'challengeAnswer'>) {
    const { name, firstName } = input;
    email = email.toLowerCase();
    await Validator.createUser.parse({ name, email, firstName });

    if (!password) {
      password = crypto.randomBytes(48).toString('base64');
    }

    const user = await this.userService.createUser({
      ...input,
      email,
      password,
      active: true,
    });

    if (!user) {
      logger('mutation.public').error(
        'Could not create new user for email "%s"',
        email
      );

      throw new InternalServerErrorException();
    }

    const externalMailTemplateId = await this.mailContext.getUserTemplateName(
      UserEvent.ACCOUNT_CREATION,
      false
    );

    await this.mailContext.sendMail({
      externalMailTemplateId,
      recipient: user,
      optionalData: {},
      mailType: mailLogType.SystemMail,
    });

    const session = await this.sessionService.createUserSession(user);

    return {
      user,
      session,
    };
  }
}
