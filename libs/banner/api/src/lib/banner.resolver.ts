import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {BannerService} from './banner.service'
import {Banner, BannerArgs, NewBannerInput, UpdateBannerInput} from './banner.model'
import {NotFoundException} from '@nestjs/common'

@Resolver('Banner')
export class BannerResolver {
  constructor(private readonly bannerService: BannerService) {}

  @Query('banners')
  async posts(@Args() args: BannerArgs): Promise<Banner[]> {
    return this.bannerService.findAll(args)
  }

  @Query('banner')
  async post(@Args('id') args: string): Promise<Banner> {
    const banner = await this.bannerService.findOne(args)
    if (!banner) {
      throw new NotFoundException()
    }
    return banner
  }

  @Mutation('createBanner')
  async create(@Args('input') args: NewBannerInput): Promise<Banner> {
    return await this.bannerService.create(args)
  }

  @Mutation('updateBanner')
  async update(@Args('input') args: UpdateBannerInput): Promise<Banner> {
    return this.bannerService.update(args)
  }

  @Mutation('deleteBanner')
  async delete(@Args('id') args: string): Promise<Banner> {
    return this.bannerService.delete(args)
  }
}
