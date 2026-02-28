import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import { computeKid } from './jwk-utils';

export const JWT_PRIVATE_KEY_TOKEN = 'JWT_PRIVATE_KEY_TOKEN';
export const JWT_PUBLIC_KEY_TOKEN = 'JWT_PUBLIC_KEY_TOKEN';
export const HOST_URL_TOKEN = 'HOST_URL_TOKEN';
export const WEBSITE_URL_TOKEN = 'WEBSITE_URL_TOKEN';

@Injectable()
export class JwtService {
  private kid: string;

  constructor(
    @Inject(JWT_PRIVATE_KEY_TOKEN) private jwtPrivateKey: string,
    @Inject(JWT_PUBLIC_KEY_TOKEN) private jwtPublicKey: string,
    @Inject(HOST_URL_TOKEN) private hostURL: string,
    @Inject(WEBSITE_URL_TOKEN) private websiteURL: string
  ) {
    if (this.jwtPublicKey) {
      const publicKey = createPublicKey({
        key: this.jwtPublicKey,
        format: 'pem',
      });
      this.kid = computeKid(publicKey.export({ format: 'jwk' }));
    } else {
      this.kid = '';
    }
  }

  generateJWT({
    id,
    expiresInMinutes = 60,
  }: {
    id: string;
    expiresInMinutes?: number;
  }): string {
    return jwt.sign({}, this.jwtPrivateKey, {
      algorithm: 'ES256',
      keyid: this.kid,
      expiresIn: expiresInMinutes * 60,
      audience: this.websiteURL,
      issuer: this.hostURL,
      subject: id,
    });
  }

  verifyJWT(token: string): string {
    if (!this.jwtPublicKey) throw new Error('No JWT_PUBLIC_KEY defined.');

    try {
      const decoded = jwt.verify(token, this.jwtPublicKey, {
        algorithms: ['ES256'],
      });
      return typeof decoded === 'object' && 'sub' in decoded ?
          (decoded.sub as string)
        : '';
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }
}
