import { forwardRef, Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  BlockTemplate,
  BlockTemplateDataloaderService,
} from '@wepublish/block-content/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { EngagementStage } from './engagement-rule.model';

@Resolver(() => EngagementStage)
export class EngagementStageResolver {
  constructor(
    private images: ImageDataloaderService,
    // block-content → article → engagement: a cycle.
    @Inject(forwardRef(() => BlockTemplateDataloaderService))
    private blockTemplates: BlockTemplateDataloaderService
  ) {}

  @ResolveField(() => Image, { nullable: true })
  image(@Parent() { imageId }: EngagementStage) {
    return imageId ? this.images.load(imageId) : null;
  }

  @ResolveField(() => BlockTemplate, { nullable: true })
  blockTemplate(@Parent() { blockTemplateId }: EngagementStage) {
    return blockTemplateId ? this.blockTemplates.load(blockTemplateId) : null;
  }
}
