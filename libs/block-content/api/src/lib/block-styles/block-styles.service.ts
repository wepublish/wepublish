import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateBlockStyleInput,
  UpdateBlockStyleInput,
} from './block-styles.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { BlockStylesDataloaderService } from './block-styles-dataloader.service';

@Injectable()
export class BlockStylesService {
  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  @PrimeDataLoader(BlockStylesDataloaderService)
  public getBlockStyles() {
    return this.prisma.blockStyle.findMany({});
  }

  @PrimeDataLoader(BlockStylesDataloaderService)
  public createBlockStyle(data: CreateBlockStyleInput) {
    return this.prisma.blockStyle.create({
      data,
    });
  }

  @PrimeDataLoader(BlockStylesDataloaderService)
  public async updateBlockStyle({ id, ...data }: UpdateBlockStyleInput) {
    const blockStyle = await this.prisma.blockStyle.update({
      where: {
        id,
      },
      data,
    });

    await this.invalidateRenderedContent();

    return blockStyle;
  }

  public async deleteBlockStyle(id: string) {
    const blockStyle = await this.prisma.blockStyle.delete({
      where: {
        id,
      },
    });

    await this.invalidateRenderedContent();

    return blockStyle;
  }

  private async invalidateRenderedContent() {
    await this.publicContentCache.invalidate();
    await this.publicContentCache.invalidateArticleLayout();
  }
}
