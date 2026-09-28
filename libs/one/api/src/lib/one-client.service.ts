import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@wepublish/session/api';
import { ONE_URL_TOKEN } from './one.tokens';

export const CHANNEL_TOKEN_HEADER = 'x-wepublish-channel-token';

@Injectable()
export class OneClientService {
  constructor(
    private jwtService: JwtService,
    @Inject(ONE_URL_TOKEN) private oneURL: string
  ) {}

  async post(path: string, scope: string, body: unknown): Promise<void> {
    const token = await this.jwtService.generateScopedJWT({
      scope,
      audience: this.oneURL,
      subject: 'wepublish-api',
      expiresInMinutes: 2,
    });

    const response = await fetch(`${this.oneURL}${path}`, {
      method: 'POST',
      headers: {
        [CHANNEL_TOKEN_HEADER]: token,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  }
}
