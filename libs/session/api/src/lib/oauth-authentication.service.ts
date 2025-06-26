import {Injectable} from '@nestjs/common'
import {UserService} from '@wepublish/user/api'
import {InvalidOAuth2TokenError, OAuth2ProviderNotFoundError} from './session.errors'
import {AuthProviderService} from '@wepublish/authprovider/api'
import {UserNotFoundError} from '@wepublish/api'

@Injectable()
export class OAuthAuthenticationService {
  constructor(
    private userService: UserService,
    private readonly authProviders: AuthProviderService
  ) {}

  async authenticateUser(providerName: string, code: string, redirectUri: string) {
    const oAuth2Client = this.authProviders.oauth2Clients.find(
      client => client.name === providerName
    )
    if (!oAuth2Client) throw new OAuth2ProviderNotFoundError(providerName)

    const token = await oAuth2Client.client.callback(redirectUri, {code})
    if (!token.access_token) throw new InvalidOAuth2TokenError()

    const userInfo = await oAuth2Client.client.userinfo(token.access_token)
    if (!userInfo.email) throw new Error('UserInfo did not return an email')

    const user = await this.userService.getUserByEmail(userInfo.email)

    if (!user) throw new UserNotFoundError()

    return user
  }
}
