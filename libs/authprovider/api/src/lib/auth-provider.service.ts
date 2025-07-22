import {OAuth2Client} from './auth-provider.types'

export class AuthProviderService {
  constructor(public oauth2Clients: OAuth2Client[]) {}

  async getAuthProviders(redirectUri?: string) {
    return this.oauth2Clients.map(client => {
      console.log(client.provider)
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
