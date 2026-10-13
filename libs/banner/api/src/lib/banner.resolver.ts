import { NotFoundException } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GateMode } from '@prisma/client';
import { Public } from '@wepublish/authentication/api';
import { GateService, PageModel } from '@wepublish/gate/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { CanGetBanner } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { BannerAction } from './banner-action.model';
import { Banner, PrimaryBannerArgs } from './banner.model';
import { PaginationArgs } from './pagination.model';
import { toBanner } from './to-banner';

/**
 * Banners are gates with mode BANNER. Only the website reads them here,
 * the editor manages them through the gate API.
 */
@Resolver(() => Banner)
export class BannerResolver {
  constructor(
    private gateService: GateService,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @Permissions(CanGetBanner)
  @Query(() => [Banner])
  async banners(@Args() { skip, take }: PaginationArgs) {
    const gates = await this.gateService.getGates({
      mode: GateMode.BANNER,
      skip,
      take,
    });

    return gates.map(toBanner);
  }

  @Permissions(CanGetBanner)
  @Query(() => Banner)
  async banner(@Args('id') id: string) {
    const banner = toBanner(await this.gateService.getGate(id));

    if (!banner) {
      throw new NotFoundException(`Banner with id ${id} not found`);
    }

    return banner;
  }

  @Public()
  @Query(() => Banner, { nullable: true })
  async primaryBanner(@Args() args: PrimaryBannerArgs) {
    return toBanner(await this.gateService.findPrimaryBanner(args));
  }

  @ResolveField(() => [BannerAction])
  async actions(@Parent() banner: Banner) {
    return banner.actions ?? [];
  }

  @ResolveField(() => [PageModel])
  async showOnPages(@Parent() banner: Banner) {
    return this.gateService.getPages(banner.id);
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
