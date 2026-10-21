import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ApiToken } from '@prisma/client';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { Strategy } from 'passport-http-bearer';

import { API_TOKEN_PREFIX } from './api-token.crypto';
import { ApiTokenService } from './api-token.service';

export const API_TOKEN_STRATEGY = 'api-token';

export const apiTokenSession = (
  apiToken: ApiToken,
  token: string
): ApiTokenSession => ({
  type: AuthSessionType.ApiToken,
  id: apiToken.id,
  name: apiToken.name,
  token,
  permissions: apiToken.scopes,
});

@Injectable()
export class ApiTokenStrategy extends PassportStrategy(
  Strategy,
  API_TOKEN_STRATEGY
) {
  constructor(private apiTokenService: ApiTokenService) {
    super();
  }

  public async validate(token: string) {
    if (!token.startsWith(API_TOKEN_PREFIX)) {
      return false;
    }

    const apiToken = await this.apiTokenService.resolveToken(token);

    if (!apiToken) {
      return false;
    }

    return apiTokenSession(apiToken, token);
  }
}
