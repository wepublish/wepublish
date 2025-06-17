import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  Authenticated,
  AuthSessionType,
  CurrentUser,
  Public,
  UserSession
} from '@wepublish/authentication/api'
import {UserInputError} from '@nestjs/apollo'
import {MemberRegistrationInput, Registration} from './register.model'
import {ChallengeService} from '@wepublish/challenge/api'
import {User, UserService} from '@wepublish/user/api'
import {CommentAuthenticationError} from '@wepublish/api'
import {RegisterService} from './register.service'

@Resolver()
export class RegisterResolver {
  constructor(
    readonly userService: UserService,
    readonly challengeService: ChallengeService,
    readonly registerService: RegisterService
  ) {}

  @Public()
  @Query(() => User, {
    description: `This query returns the user.`,
    nullable: true
  })
  async me(@CurrentUser() session: UserSession) {
    return session?.type === AuthSessionType.User ? session.user : null
  }

  @Authenticated()
  @Mutation(() => User, {
    description: `This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.`
  })
  async updatePassword(
    @Args('password') password: string,
    @Args('passwordRepeated') passwordRepeated: string,
    @CurrentUser() {user}: UserSession
  ) {
    if (password !== passwordRepeated) {
      throw new UserInputError('password and passwordRepeat are not equal')
    }
    return this.userService.updateUserPassword(user.id, password)
  }

  @Public()
  @Mutation(() => Registration, {
    description: `This mutation registers a new member by providing name, email, and other required information.`
  })
  async registerMember(@Args() {challengeAnswer, ...input}: MemberRegistrationInput) {
    const challengeValidationResult = await this.challengeService.validateChallenge({
      challengeID: challengeAnswer.challengeID,
      solution: challengeAnswer.challengeSolution
    })

    if (!challengeValidationResult.valid) {
      throw new CommentAuthenticationError(challengeValidationResult.message)
    }
    return this.registerService.registerMember(input)
  }
}
