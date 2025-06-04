import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {User} from './user.model'
import {
  Authenticated,
  AuthSessionType,
  CurrentUser,
  Public,
  UserSession
} from '@wepublish/authentication/api'
import {UserService} from './user.service'
import {UserInputError} from '@nestjs/apollo'

@Resolver(() => User)
export class UserResolver {
  constructor(readonly userService: UserService) {}

  @Public()
  @Query(() => User, {
    description: `This query returns the user.`,
    nullable: true
  })
  public me(@CurrentUser() session: UserSession) {
    return session?.type === AuthSessionType.User ? session.user : null
  }

  @Authenticated()
  @Mutation(() => User, {
    description: `This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.`
  })
  updatePassword(
    @Args('password') password: string,
    @Args('passwordRepeated') passwordRepeated: string,
    @CurrentUser() {user}: UserSession
  ) {
    if (password !== passwordRepeated) {
      throw new UserInputError('password and passwordRepeat are not equal')
    }
    return this.userService.updateUserPassword(user.id, password)
  }
}
