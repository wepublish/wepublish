import {Args, Query, Resolver} from '@nestjs/graphql'
import {AuthProvider} from './auth-provider.model'
import {Public} from '@wepublish/authentication/api'
import {AuthProviderService} from './auth-provider.service'

@Resolver(() => AuthProvider)
export class AuthProviderResolver {
  constructor(private authProviderService: AuthProviderService) {}

  @Public()
  @Query(() => [AuthProvider], {
    description: 'This query returns available OAuth providers with their authorization URLs.'
  })
  async authProviders(
    @Args('redirectUri', {nullable: true}) redirectUri?: string
  ): Promise<AuthProvider[]> {
    return this.authProviderService.getAuthProviders(redirectUri)
  }
}
