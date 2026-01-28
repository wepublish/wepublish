import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateBlockStyleInput,
  UpdateBlockStyleInput,
} from './block-styles.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { BlockStylesDataloaderService } from './block-styles-dataloader.service';

@Injectable()
export class BlockStylesService {
  constructor(private prisma: PrismaClient) {}

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
  public updateBlockStyle({ id, ...data }: UpdateBlockStyleInput) {
    return this.prisma.blockStyle.update({
      where: {
        id,
      },
      data,
    });
  }

  public deleteBlockStyle(id: string) {
    return this.prisma.blockStyle.delete({
      where: {
        id,
      },
    });
  }
}
