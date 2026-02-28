import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '@wepublish/authentication/api';
import { JWT_PUBLIC_KEY_TOKEN } from './jwt.service';
import { createPublicKey } from 'crypto';
import { computeKid } from './jwk-utils';

interface JwksKey extends JsonWebKey {
  use: string;
  alg: string;
  kid: string;
}

@Controller('.well-known')
export class JwksController {
  private cachedJwks: { keys: JwksKey[] } | null = null;

  constructor(@Inject(JWT_PUBLIC_KEY_TOKEN) private jwtPublicKey: string) {}

  @Public()
  @Get('jwks.json')
  getJwks() {
    if (!this.cachedJwks) {
      const publicKey = createPublicKey({
        key: this.jwtPublicKey,
        format: 'pem',
      });

      const jwk = publicKey.export({ format: 'jwk' });
      const kid = computeKid(jwk);

      this.cachedJwks = {
        keys: [
          {
            ...jwk,
            use: 'sig',
            alg: 'ES256',
            kid,
          },
        ],
      };
    }

    return this.cachedJwks;
  }
}
