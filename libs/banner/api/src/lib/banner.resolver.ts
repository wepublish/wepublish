import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { EngagementRuleService } from '@wepublish/engagement/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { Banner, PrimaryBannerArgs } from './banner.model';
import { primaryBannerOf } from './to-banner';

@Resolver(() => Banner)
export class BannerResolver {
  constructor(
    private rules: EngagementRuleService,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @Public()
  @Query(() => Banner, {
    nullable: true,
    deprecationReason: 'Use engagementPrompts.',
    description: `The announcement engagement rule that fits the reader best, as a banner.`,
  })
  async primaryBanner(@Args() args: PrimaryBannerArgs) {
    return primaryBannerOf(await this.rules.getActiveRules(), args);
  }

  @ResolveField(() => Image, { nullable: true })
  public image(@Parent() banner: Banner) {
    const { imageId } = banner;

    if (!imageId) {
      return null;
    }

    return this.imageDataloaderService.load(imageId);
  }
}
