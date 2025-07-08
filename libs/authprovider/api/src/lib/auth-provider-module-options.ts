import {ModuleAsyncOptions} from '@wepublish/utils/api'
import {OAuth2Client} from './auth-provider.types'

export const AUTH_PROVIDER_OAUTH2_CLIENTS = 'AUTH_PROVIDER_OAUTH2_CLIENTS'

export interface AuthProviderModuleOptions {
  oauth2Clients: OAuth2Client[]
}

export type AuthProviderModuleAsyncOptions = ModuleAsyncOptions<AuthProviderModuleOptions>
