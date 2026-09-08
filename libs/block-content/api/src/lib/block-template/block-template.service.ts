import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { getMaxTake, PrimeDataLoader, SortOrder } from '@wepublish/utils/api';
import { BlockContentInput, mapBlockUnionMap } from '../block-content.model';
import { BlockType } from '../block-type.model';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import {
  BlockTemplateFilter,
  BlockTemplateListArgs,
  BlockTemplateSort,
  CreateBlockTemplateInput,
  UpdateBlockTemplateInput,
} from './block-template.model';

@Injectable()
export class BlockTemplateService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(BlockTemplateDataloaderService)
  public async getBlockTemplates({
    filter,
    sort = BlockTemplateSort.Name,
    order = SortOrder.Ascending,
    cursorId,
    skip = 0,
    take = 10,
  }: BlockTemplateListArgs) {
    const where = createBlockTemplateFilter(filter);
    const orderBy = createBlockTemplateOrder(sort, order);

    const [totalCount, blockTemplates] = await Promise.all([
      this.prisma.blockTemplate.count({
        where,
        orderBy,
      }),
      this.prisma.blockTemplate.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = blockTemplates.slice(0, getMaxTake(take));
    const firstBlockTemplate = nodes[0];
    const lastBlockTemplate = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = blockTemplates.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstBlockTemplate?.id,
        endCursor: lastBlockTemplate?.id,
      },
    };
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

function createBlockTemplateOrder(
  field: BlockTemplateSort,
  sortOrder: SortOrder
): Prisma.BlockTemplateOrderByWithRelationInput {
  switch (field) {
    case BlockTemplateSort.CreatedAt:
      return {
        createdAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case BlockTemplateSort.ModifiedAt:
      return {
        modifiedAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case BlockTemplateSort.Name:
    default:
      return {
        name: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };
  }
}

function createBlockTemplateFilter(
  filter?: BlockTemplateFilter
): Prisma.BlockTemplateWhereInput {
  const conditions: Prisma.BlockTemplateWhereInput[] = [];

  if (filter?.name) {
    conditions.push({
      name: {
        mode: 'insensitive',
        contains: filter.name,
      },
    });
  }

  return conditions.length ? { AND: conditions } : {};
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
