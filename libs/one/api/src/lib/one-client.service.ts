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

  /** Resolves with One's json answer, or nothing when One sent no json. */
  async post(path: string, scope: string, body: unknown): Promise<unknown> {
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

    const contentType = response.headers?.get('content-type') ?? '';

    if (response.status === 204 || !contentType.includes('application/json')) {
      return undefined;
    }

    return response.json();
  }
}
