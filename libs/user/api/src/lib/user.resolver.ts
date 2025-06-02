import {Query, Resolver} from '@nestjs/graphql'
import {User} from './user.model'
import {AuthSessionType, CurrentUser, Public, UserSession} from '@wepublish/authentication/api'

@Resolver(() => User)
export class UserResolver {
  @Public()
  @Query(() => User, {
    description: `This query returns the user.`
  })
  public me(@CurrentUser() session: UserSession) {
    return session?.type === AuthSessionType.User ? session.user : null
  }
}
