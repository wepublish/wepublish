import {Client} from 'openid-client'

export interface OAuth2Provider {
  name: string
  clientId: string
  clientKey: string
  discoverUrl: string
  scopes: string[]
  redirectUri: string[]
}

export interface OAuth2Client {
  name: string
  provider: OAuth2Provider
  client: Client
}
