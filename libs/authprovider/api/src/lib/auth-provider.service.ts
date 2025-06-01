import {Inject, Injectable} from '@nestjs/common'

export const OAUTH2_CLIENTS_PROVIDER = 'OAUTH2_CLIENTS_PROVIDER'
type OAuth2ClientsProvider = () => Promise<any[]>

@Injectable()
export class AuthProviderService {
  constructor(
    @Inject(OAUTH2_CLIENTS_PROVIDER)
    private getOauth2Clients: OAuth2ClientsProvider
  ) {}

  async getAuthProviders(redirectUri?: string) {
    const clients = await this.getOauth2Clients()

    return clients.map(client => {
      const url = client.client.authorizationUrl({
        scope: client.provider.scopes.join(' '),
        response_mode: 'query',
        redirect_uri: `${redirectUri}/${client.name}`,
        state: 'fakeRandomString'
      })

      return {
        name: client.name,
        url
      }
    })
  }
}
