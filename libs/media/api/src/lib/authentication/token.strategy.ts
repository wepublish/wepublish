import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { timingSafeEqual } from 'crypto';

export const TOKEN_MODULE_OPTIONS = 'TOKEN_MODULE_OPTIONS';

export type TokenConfig = {
  token: string;
};

@Injectable()
export class TokenStrategy extends PassportStrategy(Strategy, 'token') {
  constructor(@Inject(TOKEN_MODULE_OPTIONS) private config: TokenConfig) {
    super();
  }

  public async validate(token: string) {
    const expected = Buffer.from(this.config.token);
    const received = Buffer.from(token);

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
