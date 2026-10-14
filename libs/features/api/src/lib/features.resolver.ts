import { Query, Resolver } from '@nestjs/graphql';
import { Authenticated } from '@wepublish/authentication/api';
import { FeaturesService } from './features.service';

@Resolver()
export class FeaturesResolver {
  constructor(private featuresService: FeaturesService) {}

  @Authenticated()
  @Query(() => [String], {
    description:
      'The features switched on for this medium in We.Publish One (or through WEP_FEATURES).',
  })
  features(): Promise<string[]> {
    return this.featuresService.enabledKeys();
  }
}
