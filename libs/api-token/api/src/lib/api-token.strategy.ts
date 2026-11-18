import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ApiTokenSession,
  AuthSessionType,
  EXPIRED_API_TOKEN,
} from '@wepublish/authentication/api';
import type { RequestWithResponse } from './response-back-reference';
import { Strategy } from 'passport-http-bearer';

import { API_TOKEN_PREFIX } from './api-token.crypto';
import { ApiTokenService, ResolvedApiToken } from './api-token.service';

export const API_TOKEN_STRATEGY = 'api-token';
export const API_KEY_EXPIRATION_HEADER = 'wepublish-api-key-expiration';

export const apiTokenSession = (
  { apiToken, creator, permissions }: ResolvedApiToken,
  token: string
): ApiTokenSession => ({
  type: AuthSessionType.ApiToken,
  id: apiToken.id,
  name: apiToken.name,
  token,
  permissions,
  createdBy: creator,
});

@Injectable()
export class ApiTokenStrategy extends PassportStrategy(
  Strategy,
  API_TOKEN_STRATEGY
) {
  constructor(private apiTokenService: ApiTokenService) {
    super({ passReqToCallback: true });
  }

  public async validate(req: RequestWithResponse, token: string) {
    if (!token.startsWith(API_TOKEN_PREFIX)) {
      return false;
    }

    const resolved = await this.apiTokenService
      .resolveToken(token)
      .catch(error => {
        if (
          error instanceof UnauthorizedException &&
          error.cause === EXPIRED_API_TOKEN
        ) {
          req.res?.setHeader(
            'WWW-Authenticate',
            'Bearer error="invalid_token", error_description="The API key has expired"'
          );
        }

        throw error;
      });

    if (!resolved) {
      return false;
    }

    req.res?.setHeader(
      API_KEY_EXPIRATION_HEADER,
      resolved.apiToken.expiresAt.toUTCString()
    );

    return apiTokenSession(resolved, token);
  }
}
