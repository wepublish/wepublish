import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  BannerAction,
  BannerActionArgs,
  CreateBannerActionInput,
  UpdateBannerActionInput,
} from './banner-action.model';
import { Banner } from './banner.model';

@Injectable()
export class BannerActionService {
  constructor(private prisma: PrismaClient) {}

  async findOne(id: string): Promise<BannerAction | null> {
    return this.prisma.bannerAction.findUnique({
      where: {
        id,
      },
    });
  }

  async findAll(args: BannerActionArgs): Promise<BannerAction[]> {
    return this.prisma.bannerAction.findMany({
      where: {
        bannerId: args.bannerId,
      },
    });
  }

  async create(
    banner: Banner,
    input: CreateBannerActionInput
  ): Promise<BannerAction> {
    return this.prisma.bannerAction.create({
      data: {
        ...input,
        bannerId: banner.id,
      },
    });
  }

  async update(params: UpdateBannerActionInput): Promise<BannerAction> {
    const { id, ...params_without_id } = params;

    return this.prisma.bannerAction.update({
      where: {
        id,
      },
      data: {
        ...params_without_id,
      },
    });
  }

  async delete(id: string): Promise<undefined> {
    this.prisma.bannerAction.delete({
      where: {
        id,
      },
    });
  }
}
