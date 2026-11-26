import { Inject, Injectable } from '@nestjs/common';
import { jwtVerify, type JWTVerifyGetKey } from 'jose';
import { logger } from '@wepublish/utils/api';
import { InvalidCredentialsError } from './session.errors';
import {
  WEPUBLISH_LOGIN_ISSUER,
  WEPUBLISH_LOGIN_ROLES_CLAIM,
  WEPUBLISH_LOGIN_TOKEN_URL,
  WEPUBLISH_LOGIN_USERINFO_URL,
  type WepublishIdentity,
} from './wepublish-login';

export const WEPUBLISH_LOGIN_KEYS = Symbol('WEPUBLISH_LOGIN_KEYS');

type Claims = Record<string, unknown>;

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

@Injectable()
export class WepublishIdentityService {
  constructor(@Inject(WEPUBLISH_LOGIN_KEYS) private keys: JWTVerifyGetKey) {}

  async signIn({
    clientId,
    redirectUri,
    code,
    codeVerifier,
  }: {
    clientId: string;
    redirectUri: string;
    code: string;
    codeVerifier: string;
  }): Promise<WepublishIdentity> {
    try {
      const tokens = await this.readJson(
        await fetch(WEPUBLISH_LOGIN_TOKEN_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            code_verifier: codeVerifier,
            client_id: clientId,
            redirect_uri: redirectUri,
          }).toString(),
        }),
        'token endpoint'
      );

      const { payload } = await jwtVerify(
        String(tokens['id_token']),
        this.keys,
        {
          issuer: WEPUBLISH_LOGIN_ISSUER,
          audience: clientId,
        }
      );

      if (payload.azp !== undefined && payload.azp !== clientId) {
        throw new Error(`ID token was authorized for ${payload.azp}`);
      }

      const info = await this.readJson(
        await fetch(WEPUBLISH_LOGIN_USERINFO_URL, {
          headers: { authorization: `Bearer ${text(tokens['access_token'])}` },
        }),
        'userinfo'
      );

      if (!payload.sub || info['sub'] !== payload.sub) {
        throw new Error('userinfo describes another subject');
      }

      const email = text(info['email']);

      if (!email) {
        throw new Error('userinfo has no email address');
      }

      const roles = info[WEPUBLISH_LOGIN_ROLES_CLAIM];

      return {
        subject: payload.sub,
        email,
        emailVerified: info['email_verified'] === true,
        firstName: text(info['given_name']),
        lastName: text(info['family_name']),
        name: text(info['name']),
        roles: roles && typeof roles === 'object' ? Object.keys(roles) : [],
        amr:
          Array.isArray(payload['amr']) ?
            payload['amr'].filter(
              (value): value is string => typeof value === 'string'
            )
          : [],
      };
    } catch (error) {
      logger('wepublish-login').warn(
        'We.Publish login failed: %s',
        (error as Error).message
      );

      throw new InvalidCredentialsError();
    }
  }

  private async readJson(response: Response, source: string): Promise<Claims> {
    const body = (await response.json().catch(() => ({}))) as Claims;

    if (!response.ok) {
      throw new Error(
        `${source} answered ${response.status} ${text(body['error']) ?? ''} ${
          text(body['error_description']) ?? ''
        }`.trim()
      );
    }

    return body;
  }
}
