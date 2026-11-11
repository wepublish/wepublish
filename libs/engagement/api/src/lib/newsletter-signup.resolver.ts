import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
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
  constructor(private signups: NewsletterSignupService) {}

  @Public()
  @Mutation(() => NewsletterSignup, {
    description: `Signs an email up for the newsletter, pending its confirmation by mail. Newsletter walls only ask for this.`,
  })
  async signUpForNewsletter(
    @Args('email') email: string
  ): Promise<NewsletterSignup> {
    return { newsletterToken: await this.signups.signUp(email) };
  }
}
