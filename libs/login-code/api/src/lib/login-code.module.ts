import { DynamicModule, Module, Provider } from '@nestjs/common';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { createAsyncOptionsProvider } from '@wepublish/utils/api';
import {
  LOGIN_CODE_MODULE_OPTIONS,
  LoginCodeModuleAsyncOptions,
  LoginCodeModuleOptions,
} from './login-code-module-options';
import { LoginCodeRateLimiter } from './login-code-rate-limiter';
import { LoginCodeResolver } from './login-code.resolver';
import { LoginCodeSecondFactorService } from './login-code-second-factor.service';
import { LoginCodeService } from './login-code.service';

@Module({
  imports: [PrismaModule, KvTtlCacheModule],
  exports: [
    LoginCodeService,
    LoginCodeRateLimiter,
    LoginCodeSecondFactorService,
  ],
})
export class LoginCodeModule {
  static registerAsync(options: LoginCodeModuleAsyncOptions): DynamicModule {
    return {
      module: LoginCodeModule,
      global: options.global,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
      exports: [
        LoginCodeService,
        LoginCodeRateLimiter,
        LoginCodeSecondFactorService,
      ],
    };
  }

  private static createAsyncProviders(
    options: LoginCodeModuleAsyncOptions
  ): Provider[] {
    return [
      createAsyncOptionsProvider<LoginCodeModuleOptions>(
        LOGIN_CODE_MODULE_OPTIONS,
        options
      ),
      LoginCodeService,
      LoginCodeRateLimiter,
      LoginCodeSecondFactorService,
      LoginCodeResolver,
    ];
  }
}
