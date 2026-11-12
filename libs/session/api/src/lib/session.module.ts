import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AuditLogModule } from '@wepublish/audit-log/api';
import { SESSION_TTL_TOKEN, SessionService } from './session.service';
import { SessionResolver } from './session.resolver';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  HOST_URL_TOKEN,
  JWT_PRIVATE_KEY_TOKEN,
  JWT_PUBLIC_KEY_TOKEN,
  JwtService,
  WEBSITE_URL_TOKEN,
} from './jwt.service';
import { UserModule } from '@wepublish/user/api';
import { UserAuthenticationService } from './user-authentication.service';
import { JwtAuthenticationService } from './jwt-authentication.service';
import { RegisterResolver } from './register.resolver';
import { RegisterService } from './register.service';
import { ChallengeModule } from '@wepublish/challenge/api';
import { SettingModule } from '@wepublish/settings/api';
import { JwksController } from './jwks.controller';
import { TotpService } from './totp.service';
import { TotpResolver } from './totp.resolver';
import { WebsiteTokenController } from './website-token.controller';
import { createRemoteJWKSet } from 'jose';
import {
  WEPUBLISH_LOGIN_KEYS,
  WepublishIdentityService,
} from './wepublish-identity.service';
import { WEPUBLISH_LOGIN_JWKS_URL } from './wepublish-login';
import { WepublishLoginResolver } from './wepublish-login.resolver';
import { WepublishLoginService } from './wepublish-login.service';
import {
  SessionCacheModule,
  SCOPED_JWT_VERIFIER,
  ScopedJwtGuard,
} from '@wepublish/authentication/api';

export interface SessionModuleOptions {
  sessionTTL: number;
  jwtPrivateKey: string;
  jwtPublicKey: string;
  hostURL: string;
  websiteURL: string;
}

export interface SessionModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useFactory: (
    ...args: any[]
  ) => Promise<SessionModuleOptions> | SessionModuleOptions;
  inject?: any[];
}

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    UserModule,
    ChallengeModule,
    SettingModule,
    SessionCacheModule,
  ],
  exports: [SessionService, JwtService, SCOPED_JWT_VERIFIER, ScopedJwtGuard],
})
export class SessionModule {
  static registerAsync(options: SessionModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: SessionModule,
      imports: options.imports || [],
      exports: [SessionService, JwtService, ScopedJwtGuard],
      controllers: [JwksController, WebsiteTokenController],
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: SCOPED_JWT_VERIFIER,
          useExisting: JwtService,
        },
        ScopedJwtGuard,
      ],
    };
  }

  private static createAsyncProviders(
    options: SessionModuleAsyncOptions
  ): Provider[] {
    return [
      SessionService,
      SessionResolver,
      JwtService,
      UserAuthenticationService,
      JwtAuthenticationService,
      RegisterService,
      RegisterResolver,
      TotpService,
      TotpResolver,
      WepublishIdentityService,
      WepublishLoginService,
      WepublishLoginResolver,
      {
        provide: WEPUBLISH_LOGIN_KEYS,
        useFactory: () => createRemoteJWKSet(new URL(WEPUBLISH_LOGIN_JWKS_URL)),
      },
      {
        provide: SESSION_TTL_TOKEN,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.sessionTTL;
        },
        inject: options.inject || [],
      },
      {
        provide: JWT_PRIVATE_KEY_TOKEN,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.jwtPrivateKey;
        },
        inject: options.inject || [],
      },
      {
        provide: JWT_PUBLIC_KEY_TOKEN,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.jwtPublicKey;
        },
        inject: options.inject || [],
      },
      {
        provide: HOST_URL_TOKEN,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.hostURL;
        },
        inject: options.inject || [],
      },
      {
        provide: WEBSITE_URL_TOKEN,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.websiteURL;
        },
        inject: options.inject || [],
      },
    ];
  }
}
