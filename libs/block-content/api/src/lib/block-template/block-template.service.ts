import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { BlockContentInput, mapBlockUnionMap } from '../block-content.model';
import { BlockType } from '../block-type.model';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import {
  CreateBlockTemplateInput,
  UpdateBlockTemplateInput,
} from './block-template.model';

@Injectable()
export class BlockTemplateService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(BlockTemplateDataloaderService)
  public getBlockTemplates() {
    return this.prisma.blockTemplate.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  @PrimeDataLoader(BlockTemplateDataloaderService)
  public createBlockTemplate({ name, blocks }: CreateBlockTemplateInput) {
    return this.prisma.blockTemplate.create({
      data: {
        name,
        blocks: this.mapBlocks(blocks),
      },
    });
  }

  @PrimeDataLoader(BlockTemplateDataloaderService)
  public updateBlockTemplate({ id, name, blocks }: UpdateBlockTemplateInput) {
    return this.prisma.blockTemplate.update({
      where: {
        id,
      },
      data: {
        name,
        blocks: this.mapBlocks(blocks),
      },
    });
  }

  public deleteBlockTemplate(id: string) {
    return this.prisma.blockTemplate.delete({
      where: {
        id,
      },
    });
  }

  private mapBlocks(blocks: BlockContentInput[]): Prisma.InputJsonValue {
    blocks.forEach(assertNoTemplateBlock);

    return blocks.map(mapBlockUnionMap) as unknown as Prisma.InputJsonValue;
  }
}

function assertNoTemplateBlock(block: BlockContentInput) {
  if (block[BlockType.BlockTemplate]) {
    throw new BadRequestException(
      `Block templates can not contain other block templates.`
    );
  }

  block[BlockType.FlexBlock]?.blocks.forEach(({ block }) => {
    if (block) {
      assertNoTemplateBlock(block);
    }
  });
}
