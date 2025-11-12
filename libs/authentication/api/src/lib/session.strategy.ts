import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy, 'session') {
  constructor(private authService: AuthenticationService) {
    super();
  }

  public async validate(token: string) {
    const session = await this.authService.getSessionByToken(token);
    const isSessionValid = this.authService.isSessionValid(session);

    if (!isSessionValid) {
      return false;
    }

    return session;
  }
}
