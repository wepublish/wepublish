import {DynamicModule, Module, Provider} from '@nestjs/common'
import {AuthProviderResolver} from './auth-provider.resolver'
import {AuthProviderService} from './auth-provider.service'
import {createAsyncOptionsProvider} from '@wepublish/utils/api'
import {
  AUTH_PROVIDER_OAUTH2_CLIENTS,
  AuthProviderModuleAsyncOptions,
  AuthProviderModuleOptions
} from './auth-provider-module-options'

@Module({
  providers: [AuthProviderService, AuthProviderResolver],
  exports: [AuthProviderService, AuthProviderResolver]
})
export class AuthProviderModule {
  static registerAsync(options: AuthProviderModuleAsyncOptions): DynamicModule {
    return {
      module: AuthProviderModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    }
  }

  private static createAsyncProviders(options: AuthProviderModuleAsyncOptions): Provider[] {
    return [
      createAsyncOptionsProvider<AuthProviderModuleOptions>(AUTH_PROVIDER_OAUTH2_CLIENTS, options),
      {
        provide: AuthProviderService,
        useFactory: ({oauth2Clients}: AuthProviderModuleOptions) =>
          new AuthProviderService(oauth2Clients),
        inject: [AUTH_PROVIDER_OAUTH2_CLIENTS]
      }
    ]
  }
}
