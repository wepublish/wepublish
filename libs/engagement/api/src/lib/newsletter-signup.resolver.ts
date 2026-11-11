import { BadRequestException } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import {
  AuthSession,
  AuthSessionType,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import { ChallengeInput, ChallengeService } from '@wepublish/challenge/api';
import { NewsletterSignupService } from './newsletter-signup.service';

@ObjectType()
export class NewsletterSignup {
  @Field({
    description: `Keep it (the website uses a cookie) and send it with viewArticle and engagementPrompts: it gets the reader past newsletter walls and keeps newsletter prompts away.`,
  })
  newsletterToken!: string;
}

@Resolver(() => NewsletterSignup)
export class NewsletterSignupResolver {
  constructor(
    private signups: NewsletterSignupService,
    private challenges: ChallengeService
  ) {}

  @Public()
  @Mutation(() => NewsletterSignup, {
    description: `Signs an email up for the newsletter, pending its confirmation by mail. Newsletter walls only ask for this. Readers who are not logged in solve the challenge first, so no script sends confirmation mails to other people's addresses.`,
  })
  async signUpForNewsletter(
    @Args('email') email: string,
    @Args('challengeAnswer', { type: () => ChallengeInput, nullable: true })
    challengeAnswer: ChallengeInput | null | undefined,
    @CurrentUser() session: AuthSession | undefined
  ): Promise<NewsletterSignup> {
    if (session?.type !== AuthSessionType.User) {
      const { valid, message } =
        challengeAnswer ?
          await this.challenges.validateChallenge({
            challengeID: challengeAnswer.challengeID,
            solution: challengeAnswer.challengeSolution,
          })
        : { valid: false, message: 'Solve the challenge to sign up.' };

      if (!valid) {
        throw new BadRequestException(message);
      }
    }

    return { newsletterToken: await this.signups.signUp(email) };
  }
}
