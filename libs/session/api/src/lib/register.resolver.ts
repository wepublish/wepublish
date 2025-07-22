import {Args, Mutation, Resolver} from '@nestjs/graphql'
import {Public} from '@wepublish/authentication/api'
import {MemberRegistrationInput, Registration} from './register.model'
import {ChallengeService} from '@wepublish/challenge/api'
import {CommentAuthenticationError} from '@wepublish/api'
import {RegisterService} from './register.service'

@Resolver()
export class RegisterResolver {
  constructor(
    readonly challengeService: ChallengeService,
    readonly registerService: RegisterService
  ) {}

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
