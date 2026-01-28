import { Query, Resolver } from '@nestjs/graphql';
import { Challenge } from './challenge.model';
import { ChallengeService } from './challenge.service';
import { Public } from '@wepublish/authentication/api';

@Resolver(() => Challenge)
export class ChallengeResolver {
  constructor(private challengeService: ChallengeService) {}

  @Query(() => Challenge, {
    description:
      'This query generates a challenge which can be used to access protected endpoints.',
  })
  @Public()
  async challenge(): Promise<Challenge> {
    return this.challengeService.generateChallenge();
  }
}
