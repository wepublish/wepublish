import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ApiToken } from '@prisma/client';
import {
  ApiTokenSession,
  AuthSessionType,
  EXPIRED_API_TOKEN,
} from '@wepublish/authentication/api';
import { Request } from 'express';
import { Strategy } from 'passport-http-bearer';

import { API_TOKEN_PREFIX } from './api-token.crypto';
import { ApiTokenService } from './api-token.service';

export const API_TOKEN_STRATEGY = 'api-token';
export const API_KEY_EXPIRATION_HEADER = 'wepublish-api-key-expiration';

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
    super({ passReqToCallback: true });
  }

  public async validate(req: Request, token: string) {
    if (!token.startsWith(API_TOKEN_PREFIX)) {
      return false;
    }

    const apiToken = await this.apiTokenService
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

    if (!apiToken) {
      return false;
    }

    req.res?.setHeader(
      API_KEY_EXPIRATION_HEADER,
      apiToken.expiresAt.toUTCString()
    );

    return apiTokenSession(apiToken, token);
  }
}
