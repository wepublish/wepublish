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
  public async createBlockTemplate({ name, blocks }: CreateBlockTemplateInput) {
    return this.prisma.blockTemplate.create({
      data: {
        name,
        blocks: await this.mapBlocks(blocks),
      },
    });
  }

  @PrimeDataLoader(BlockTemplateDataloaderService)
  public async updateBlockTemplate({
    id,
    name,
    blocks,
  }: UpdateBlockTemplateInput) {
    return this.prisma.blockTemplate.update({
      where: {
        id,
      },
      data: {
        name,
        blocks: await this.mapBlocks(blocks, id),
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

  private async mapBlocks(
    blocks: BlockContentInput[],
    id?: string
  ): Promise<Prisma.InputJsonValue> {
    const referencedIDs = getInputTemplateIDs(blocks);

    if (referencedIDs.some(referencedID => !referencedID)) {
      throw new BadRequestException(
        `Block template blocks without a referenced block template can not be saved.`
      );
    }

    if (id) {
      await this.assertNoCircularReference(id, referencedIDs);
    }

    return blocks.map(mapBlockUnionMap) as unknown as Prisma.InputJsonValue;
  }

  private async assertNoCircularReference(id: string, templateIDs: string[]) {
    let referencedIDs = new Set(templateIDs);
    const visitedIDs = new Set<string>();

    while (referencedIDs.size) {
      if (referencedIDs.has(id)) {
        throw new BadRequestException(
          `Block templates can not contain circular references.`
        );
      }

      const idsToVisit = [...referencedIDs].filter(
        referencedID => !visitedIDs.has(referencedID)
      );

      if (!idsToVisit.length) {
        return;
      }

      idsToVisit.forEach(idToVisit => visitedIDs.add(idToVisit));

      const templates = await this.prisma.blockTemplate.findMany({
        where: {
          id: {
            in: idsToVisit,
          },
        },
        select: {
          blocks: true,
        },
      });

      referencedIDs = new Set(
        templates.flatMap(({ blocks }) => getStoredTemplateIDs(blocks))
      );
    }
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

function getInputTemplateIDs(blocks: BlockContentInput[]): string[] {
  return blocks.flatMap(block => {
    const templateBlock = block[BlockType.BlockTemplate];

    if (templateBlock) {
      return [templateBlock.templateID];
    }

    const nestedBlocks = block[BlockType.FlexBlock]?.blocks
      .map(({ block }) => block)
      .filter((block): block is BlockContentInput => !!block);

    return nestedBlocks ? getInputTemplateIDs(nestedBlocks) : [];
  });
}

type StoredBlock = {
  type?: BlockType;
  templateID?: string;
  blocks?: ({ block?: StoredBlock } | null)[];
};

function getStoredTemplateIDs(blocks: unknown): string[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return (blocks as (StoredBlock | null)[]).flatMap(block => {
    if (block?.type === BlockType.BlockTemplate) {
      return block.templateID ? [block.templateID] : [];
    }

    if (block?.type === BlockType.FlexBlock) {
      return getStoredTemplateIDs(
        block.blocks
          ?.map(nestedBlock => nestedBlock?.block)
          .filter(nestedBlock => !!nestedBlock) ?? []
      );
    }

    return [];
  });
}
