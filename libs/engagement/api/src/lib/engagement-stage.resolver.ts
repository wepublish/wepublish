import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { EngagementStage } from './engagement-rule.model';

@Resolver(() => EngagementStage)
export class EngagementStageResolver {
  constructor(private images: ImageDataloaderService) {}

  @ResolveField(() => Image, { nullable: true })
  image(@Parent() { imageId }: EngagementStage) {
    return imageId ? this.images.load(imageId) : null;
  }
}
