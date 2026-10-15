import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { FeaturesService } from '@wepublish/features/api';
import { GraphQLJSONObject } from 'graphql-type-json';
import { OneScopedJwt } from './one-scoped-jwt.decorator';

@Resolver()
export class MediumFeaturesResolver {
  constructor(private features: FeaturesService) {}

  /**
   * One pushes the complete feature state right after a toggle changed; the
   * heartbeat brings the same state within minutes if this call is missed.
   */
  @OneScopedJwt('write:features')
  @Mutation(() => [String], {
    name: 'applyMediumFeatures',
    description:
      'Called by We.Publish One. Replaces the feature state of this medium and returns the features now switched on.',
  })
  async applyMediumFeatures(
    @Args('features', { type: () => GraphQLJSONObject })
    features: Record<string, boolean>
  ): Promise<string[]> {
    await this.features.apply(features);

    return this.features.enabledKeys();
  }
}
