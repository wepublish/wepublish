import { DynamicModule, Module, Provider } from '@nestjs/common';
import { SESSION_TTL_TOKEN, SessionService } from './session.service';
import { SessionResolver } from './session.resolver';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  HOST_URL_TOKEN,
  JWT_SECRET_KEY_TOKEN,
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

export interface SessionModuleOptions {
  sessionTTL: number;
  jwtSecretKey: string;
  hostURL: string;
  websiteURL: string;
}

export interface SessionModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<SessionModuleOptions> | SessionModuleOptions;
  inject?: any[];
}

@Module({
  imports: [PrismaModule, UserModule, ChallengeModule, SettingModule],
  exports: [SessionService],
})
export class SessionModule {
  static registerAsync(options: SessionModuleAsyncOptions): DynamicModule {
    return {
      module: SessionModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options)],
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
      {
        provide: SESSION_TTL_TOKEN,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.sessionTTL;
        },
        inject: options.inject || [],
      },
      {
        provide: JWT_SECRET_KEY_TOKEN,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config.jwtSecretKey;
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
