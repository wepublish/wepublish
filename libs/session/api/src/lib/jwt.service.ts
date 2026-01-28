import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

export const JWT_SECRET_KEY_TOKEN = 'JWT_SECRET_KEY_TOKEN';
export const HOST_URL_TOKEN = 'HOST_URL_TOKEN';
export const WEBSITE_URL_TOKEN = 'WEBSITE_URL_TOKEN';

@Injectable()
export class JwtService {
  constructor(
    @Inject(JWT_SECRET_KEY_TOKEN) private jwtSecretKey: string,
    @Inject(HOST_URL_TOKEN) private hostURL: string,
    @Inject(WEBSITE_URL_TOKEN) private websiteURL: string
  ) {}

  generateJWT({
    id,
    expiresInMinutes = 60,
  }: {
    id: string;
    expiresInMinutes?: number;
  }): string {
    return jwt.sign({}, this.jwtSecretKey, {
      expiresIn: expiresInMinutes * 60,
      audience: this.websiteURL,
      issuer: this.hostURL,
      subject: id,
    });
  }

  verifyJWT(token: string): string {
    if (!this.jwtSecretKey) throw new Error('No JWT_SECRET_KEY defined.');

    try {
      const decoded = jwt.verify(token, this.jwtSecretKey);
      return typeof decoded === 'object' && 'sub' in decoded ?
          (decoded.sub as string)
        : '';
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }
}
