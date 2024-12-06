import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {BannerService} from './banner.service'
import {
  Banner,
  CreateBannerInput,
  PageModel,
  PrimaryBannerArgs,
  UpdateBannerInput
} from './banner.model'
import {NotFoundException} from '@nestjs/common'
import {BannerActionService} from './banner-action.service'
import {BannerAction} from './banner-action.model'
import {PaginationArgs} from './pagination.model'
import {Image} from '@wepublish/image/api'
import {
  CanCreateBanner,
  CanUpdateBanner,
  CanDeleteBanner,
  CanGetBanner,
  Permissions
} from '@wepublish/permissions/api'

@Resolver(() => Banner)
export class BannerResolver {
  constructor(
    private readonly bannerService: BannerService,
    private readonly bannerActionService: BannerActionService
  ) {}

  @Permissions(CanGetBanner)
  @Query(() => [Banner])
  async banners(@Args() args: PaginationArgs): Promise<Banner[]> {
    return this.bannerService.findAll(args)
  }

  @Permissions(CanGetBanner)
  @Query(() => Banner)
  async banner(@Args('id') args: string): Promise<Banner> {
    const banner = await this.bannerService.findOne(args)

    if (!banner) {
      throw new NotFoundException()
    }

    return banner
  }

  @Query(() => Banner)
  async primaryBanner(@Args() args: PrimaryBannerArgs): Promise<Banner> {
    const banner = await this.bannerService.findFirst(args)

    if (!banner) {
      throw new NotFoundException()
    }

    return banner
  }

  @ResolveField(() => [BannerAction])
  async actions(@Parent() banner: Banner) {
    const {id} = banner
    return this.bannerActionService.findAll({bannerId: id})
  }

  @ResolveField(() => [PageModel])
  async showOnPages(@Parent() banner: Banner) {
    const {id} = banner

    return this.bannerService.findPages(id)
  }

  @ResolveField(() => Image, {nullable: true})
  public image(@Parent() banner: Banner) {
    const {imageId} = banner

    if (!imageId) {
      return null
    }

    return {__typename: 'Image', id: imageId}
  }

  @Permissions(CanCreateBanner)
  @Mutation(() => Banner)
  async createBanner(@Args('input') args: CreateBannerInput): Promise<Banner> {
    return await this.bannerService.create(args)
  }

  @Permissions(CanUpdateBanner)
  @Mutation(() => Banner)
  async updateBanner(@Args('input') args: UpdateBannerInput): Promise<Banner> {
    return this.bannerService.update(args)
  }

  @Permissions(CanDeleteBanner)
  @Mutation(() => Boolean, {nullable: true})
  async deleteBanner(@Args('id') args: string): Promise<void> {
    await this.bannerService.delete(args)
  }
}
