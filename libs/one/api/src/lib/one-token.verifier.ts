import { Inject, Injectable } from '@nestjs/common';
import { decodeProtectedHeader, jwtVerify } from 'jose';
import { OneJwksClientService } from './one-jwks-client.service';
import { ONE_HOST_URL_TOKEN, ONE_URL_TOKEN } from './one.tokens';

@Injectable()
export class OneTokenVerifier {
  constructor(
    private jwks: OneJwksClientService,
    @Inject(ONE_URL_TOKEN) private oneURL: string,
    @Inject(ONE_HOST_URL_TOKEN) private hostURL: string
  ) {}

  async verifyScopedJWT(
    token: string,
    expectedScope: string
  ): Promise<boolean> {
    if (!this.oneURL) {
      return false;
    }

    try {
      const { kid } = decodeProtectedHeader(token);
      const key = await this.jwks.getKey(kid);

      const { payload } = await jwtVerify(token, key, {
        algorithms: ['EdDSA'],
        issuer: this.oneURL,
        audience: this.hostURL,
        clockTolerance: 30,
      });

      return payload['scope'] === expectedScope;
    } catch {
      return false;
    }
  }
}
