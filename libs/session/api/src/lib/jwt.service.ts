import { Inject, Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { createPublicKey } from 'crypto';
import { computeKid } from './jwk-utils';

export const JWT_PRIVATE_KEY_TOKEN = 'JWT_PRIVATE_KEY_TOKEN';
export const JWT_PUBLIC_KEY_TOKEN = 'JWT_PUBLIC_KEY_TOKEN';
export const HOST_URL_TOKEN = 'HOST_URL_TOKEN';
export const WEBSITE_URL_TOKEN = 'WEBSITE_URL_TOKEN';

@Injectable()
export class JwtService {
  private kid: string;
  private privateKey: Promise<CryptoKey>;
  private publicKey: Promise<CryptoKey>;

  constructor(
    @Inject(JWT_PRIVATE_KEY_TOKEN) private jwtPrivateKey: string,
    @Inject(JWT_PUBLIC_KEY_TOKEN) private jwtPublicKey: string,
    @Inject(HOST_URL_TOKEN) private hostURL: string,
    @Inject(WEBSITE_URL_TOKEN) private websiteURL: string
  ) {
    if (!this.jwtPrivateKey) {
      throw new Error(
        'JWT_PRIVATE_KEY is not set. The API cannot start without a valid Ed25519 private key.'
      );
    }

    if (!this.jwtPublicKey) {
      throw new Error(
        'JWT_PUBLIC_KEY is not set. The API cannot start without a valid Ed25519 public key.'
      );
    }

    this.privateKey = importPKCS8(this.jwtPrivateKey, 'EdDSA');
    this.publicKey = importSPKI(this.jwtPublicKey, 'EdDSA');

    const publicKey = createPublicKey({
      key: this.jwtPublicKey,
      format: 'pem',
    });
    this.kid = computeKid(publicKey.export({ format: 'jwk' }));
  }

  async generateJWT({
    id,
    expiresInMinutes = 60,
    audience,
  }: {
    id: string;
    expiresInMinutes?: number;
    audience?: string;
  }): Promise<string> {
    const key = await this.privateKey;

    return new SignJWT({})
      .setProtectedHeader({ alg: 'EdDSA', kid: this.kid })
      .setSubject(id)
      .setIssuer(this.hostURL)
      .setAudience(audience ?? this.websiteURL)
      .setExpirationTime(`${expiresInMinutes}m`)
      .sign(key);
  }

  async verifyJWT(token: string, audience?: string): Promise<string> {
    try {
      const key = await this.publicKey;
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['EdDSA'],
        issuer: this.hostURL,
        audience: audience ?? this.websiteURL,
      });
      return payload.sub ?? '';
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }
}
