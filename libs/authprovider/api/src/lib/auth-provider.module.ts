import {DynamicModule, Module, Provider} from '@nestjs/common'
import {AuthProviderResolver} from './auth-provider.resolver'
import {AuthProviderService, OAUTH2_CLIENTS_PROVIDER} from './auth-provider.service'
import {ModuleMetadata} from '@nestjs/common/interfaces'
import {APP_GUARD} from '@nestjs/core'
import {OptionalAuthenticationGuard, PublicGuard} from '@wepublish/authentication/api'
import {OneOfGuard} from '@wepublish/nest-modules'

export interface AuthProviderModuleOptions {
  oauth2ProvidersFactory: () => Promise<any[]>
}

export interface AuthProviderModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AuthProviderModuleOptions> | AuthProviderModuleOptions
  inject?: any[]
}

@Module({
  providers: [
    AuthProviderService,
    AuthProviderResolver,
    // Add authentication guards to ensure Public decorator works
    {
      provide: APP_GUARD,
      useClass: OptionalAuthenticationGuard
    },
    {
      provide: APP_GUARD,
      useClass: OneOfGuard
    },
    PublicGuard
  ],
  exports: [AuthProviderService, AuthProviderResolver]
})
export class AuthProviderModule {
  static register(options: AuthProviderModuleOptions): DynamicModule {
    return {
      module: AuthProviderModule,
      providers: [
        {
          provide: OAUTH2_CLIENTS_PROVIDER,
          useFactory: () => options.oauth2ProvidersFactory
        }
      ]
    }
  }

  static registerAsync(options: AuthProviderModuleAsyncOptions): DynamicModule {
    return {
      module: AuthProviderModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options)]
    }
  }

  private static createAsyncProviders(options: AuthProviderModuleAsyncOptions): Provider[] {
    return [
      {
        provide: OAUTH2_CLIENTS_PROVIDER,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args)
          return config.oauth2ProvidersFactory
        },
        inject: options.inject || []
      }
    ]
  }
}
