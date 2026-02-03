import { Injectable } from '@nestjs/common';
import { SessionService } from './session.service';
import { RegisterUserInput, UserService } from '@wepublish/user/api';
import { MailContext } from '@wepublish/mail/api';

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
  }: Omit<RegisterUserInput, 'challengeAnswer'>) {
    const user = await this.userService.createUser({
      ...input,
      email,
      password,
      active: true,
      properties: [],
      roleIDs: [],
    });

    const session = await this.sessionService.createUserSession(user);

    return {
      user,
      session,
    };
  }
}
