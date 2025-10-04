import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { BannerService } from './banner.service';
import {
  Banner,
  CreateBannerInput,
  PageModel,
  PrimaryBannerArgs,
  UpdateBannerInput,
} from './banner.model';
import { BannerActionService } from './banner-action.service';
import { BannerAction } from './banner-action.model';
import { PaginationArgs } from './pagination.model';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import {
  CanCreateBanner,
  CanDeleteBanner,
  CanGetBanner,
  CanUpdateBanner,
} from '@wepublish/permissions';
import { Public } from '@wepublish/authentication/api';
import { NotFoundException } from '@nestjs/common';
import { Permissions } from '@wepublish/permissions/api';

@Resolver(() => Banner)
export class BannerResolver {
  constructor(
    private bannerService: BannerService,
    private bannerActionService: BannerActionService,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @Permissions(CanGetBanner)
  @Query(() => [Banner])
  async banners(@Args() args: PaginationArgs) {
    return this.bannerService.findAll(args);
  }

  @Permissions(CanGetBanner)
  @Query(() => Banner)
  async banner(@Args('id') args: string) {
    const banner = await this.bannerService.findOne(args);
    if (!banner) {
      throw new NotFoundException(`Banner with id ${args} not found`);
    }
    return banner;
  }

  @Public()
  @Query(() => Banner, { nullable: true })
  async primaryBanner(@Args() args: PrimaryBannerArgs) {
    return await this.bannerService.findFirst(args);
  }

  @ResolveField(() => [BannerAction])
  async actions(@Parent() banner: Banner) {
    const { id } = banner;
    return this.bannerActionService.findAll({ bannerId: id });
  }

  @ResolveField(() => [PageModel])
  async showOnPages(@Parent() banner: Banner) {
    const { id } = banner;

    return this.bannerService.findPages(id);
  }

  @ResolveField(() => Image, { nullable: true })
  public image(@Parent() banner: Banner) {
    const { imageId } = banner;

    if (!imageId) {
      return null;
    }

    return this.imageDataloaderService.load(imageId);
  }

  @Permissions(CanCreateBanner)
  @Mutation(() => Banner)
  async createBanner(@Args('input') args: CreateBannerInput) {
    return await this.bannerService.create(args);
  }

  @Permissions(CanUpdateBanner)
  @Mutation(() => Banner)
  async updateBanner(@Args('input') args: UpdateBannerInput) {
    return this.bannerService.update(args);
  }

  @Permissions(CanDeleteBanner)
  @Mutation(() => Boolean, { nullable: true })
  async deleteBanner(@Args('id') args: string) {
    await this.bannerService.delete(args);
  }
}
