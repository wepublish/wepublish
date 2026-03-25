import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthenticationService } from './authentication.service';
import { Request } from 'express';

export const PEER_USER_AGENT = 'We.Publish/1.0 Peering';
export const INVALID_PEER_TOKEN = 'invalid-peer-token';

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy, 'session') {
  constructor(private authService: AuthenticationService) {
    super({
      passReqToCallback: true,
    });
  }

  public async validate(req: Request, token: string) {
    const session =
      req.headers['user-agent'] === PEER_USER_AGENT ?
        await this.authService.getPeerSession(token)
      : await this.authService.getUserSession(token);

    const isSessionValid = this.authService.isSessionValid(session);

    if (!isSessionValid) {
      if (req.headers['user-agent'] === PEER_USER_AGENT) {
        throw new UnauthorizedException('Token is invalid', {
          cause: INVALID_PEER_TOKEN,
        });
      }

      return false;
    }

    return session;
  }
}
