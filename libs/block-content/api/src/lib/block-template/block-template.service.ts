import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { getMaxTake, PrimeDataLoader, SortOrder } from '@wepublish/utils/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import {
  PuckDocumentInput,
  puckDocumentColumns,
} from '@wepublish/puck-content/api';
import { BlockContentInput, mapBlockUnionMap } from '../block-content.model';
import { BlockType } from '../block-type.model';
import { linkedTemplateIdsOf } from '../puck/linked-template';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import {
  BlockTemplateFilter,
  BlockTemplateListArgs,
  BlockTemplateSort,
  CreateBlockTemplateInput,
  UpdateBlockTemplateInput,
} from './block-template.model';

type TemplateContent = PuckDocumentInput & {
  blocks?: BlockContentInput[] | null;
};

type MappedTemplateContent = {
  blocks: Prisma.InputJsonValue;
} & ReturnType<typeof puckDocumentColumns>;

@Injectable()
export class BlockTemplateService {
  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

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
  public async createBlockTemplate({
    name,
    blocks,
    puckBlocks,
    puckRegistry,
  }: CreateBlockTemplateInput) {
    return this.prisma.blockTemplate.create({
      data: {
        name,
        ...(await this.mapTemplateContent({
          blocks,
          puckBlocks,
          puckRegistry,
        })),
      },
    });
  }

  @PrimeDataLoader(BlockTemplateDataloaderService)
  public async updateBlockTemplate({
    id,
    name,
    blocks,
    puckBlocks,
    puckRegistry,
  }: UpdateBlockTemplateInput) {
    await this.assertNotOwnedByTemplate(id);

    const blockTemplate = await this.prisma.blockTemplate.update({
      where: {
        id,
      },
      data: {
        name,
        ...(await this.mapTemplateContent(
          { blocks, puckBlocks, puckRegistry },
          id
        )),
      },
    });

    await this.invalidateRenderedContent();

    return blockTemplate;
  }

  public async deleteBlockTemplate(id: string) {
    await this.assertNotOwnedByTemplate(id);

    const blockTemplate = await this.prisma.blockTemplate.delete({
      where: {
        id,
      },
    });

    await this.invalidateRenderedContent();

    return blockTemplate;
  }

  private async invalidateRenderedContent() {
    await this.publicContentCache.invalidate();
    await this.publicContentCache.invalidateArticleLayout();
  }

  public async mapBlocks(
    blocks: BlockContentInput[],
    id?: string
  ): Promise<Prisma.InputJsonValue> {
    const referencedIDs = getInputTemplateIDs(blocks);

    if (referencedIDs.some(referencedID => !referencedID)) {
      throw new BadRequestException(
        `Block template blocks without a referenced block template can not be saved.`
      );
    }

    if (referencedIDs.length) {
      await this.assertNoTemplateReference(referencedIDs);
    }

    if (id) {
      await this.assertNoCircularReference(id, referencedIDs);
    }

    return blocks.map(mapBlockUnionMap) as unknown as Prisma.InputJsonValue;
  }

  public async mapTemplateContent(
    content: TemplateContent
  ): Promise<MappedTemplateContent>;
  public async mapTemplateContent(
    content: TemplateContent,
    id: string
  ): Promise<Partial<MappedTemplateContent>>;
  public async mapTemplateContent(
    { blocks, puckBlocks, puckRegistry }: TemplateContent,
    id?: string
  ): Promise<Partial<MappedTemplateContent>> {
    const stored =
      id ?
        await this.prisma.blockTemplate.findUnique({
          where: { id },
          select: { puckBlocks: true, puckRegistry: true },
        })
      : null;
    const puckDocument = puckDocumentColumns(
      { puckBlocks, puckRegistry },
      stored
    );

    const linkedIDs = linkedTemplateIdsOf(puckBlocks);

    if (linkedIDs.length) {
      await this.assertNoTemplateReference(linkedIDs);
    }

    if (id && linkedIDs.length) {
      await this.assertNoCircularReference(id, linkedIDs);
    }

    if (id && !blocks) {
      return puckDocument;
    }

    return {
      blocks: await this.mapBlocks(blocks ?? [], id),
      ...puckDocument,
    };
  }

  private async assertNotOwnedByTemplate(id: string) {
    const [articleTemplates, pageTemplates] = await Promise.all([
      this.prisma.articleTemplate.count({
        where: {
          blockTemplateId: id,
        },
      }),
      this.prisma.pageTemplate.count({
        where: {
          blockTemplateId: id,
        },
      }),
    ]);

    if (articleTemplates || pageTemplates) {
      throw new BadRequestException(
        `Article and page templates can only be changed as article or page templates.`
      );
    }
  }

  private async assertNoTemplateReference(templateIds: string[]) {
    const templates = await this.prisma.blockTemplate.count({
      where: {
        id: {
          in: templateIds,
        },
        OR: [
          { articleTemplate: { isNot: null } },
          { pageTemplate: { isNot: null } },
        ],
      },
    });

    if (templates) {
      throw new BadRequestException(
        `Article and page templates can not be used as block templates.`
      );
    }
  }

  public async linkedTemplateIds({
    blocks,
    puckBlocks,
  }: {
    blocks?: unknown;
    puckBlocks?: unknown;
  }): Promise<string[]> {
    return this.referencedClosure(referencedTemplateIds(blocks, puckBlocks));
  }

  private async referencedClosure(
    templateIds: string[],
    stopAt?: string
  ): Promise<string[]> {
    const found = new Set<string>();
    let referencedIDs = new Set(templateIds);

    while (referencedIDs.size) {
      if (stopAt && referencedIDs.has(stopAt)) {
        throw new BadRequestException(
          `Block templates can not contain circular references.`
        );
      }

      const idsToVisit = [...referencedIDs].filter(
        referencedID => !found.has(referencedID)
      );

      if (!idsToVisit.length) {
        break;
      }

      idsToVisit.forEach(idToVisit => found.add(idToVisit));

      const templates = await this.prisma.blockTemplate.findMany({
        where: {
          id: {
            in: idsToVisit,
          },
        },
        select: {
          blocks: true,
          puckBlocks: true,
        },
      });

      referencedIDs = new Set(
        templates.flatMap(({ blocks, puckBlocks }) =>
          referencedTemplateIds(blocks, puckBlocks)
        )
      );
    }

    return [...found];
  }

  private async assertNoCircularReference(id: string, templateIds: string[]) {
    await this.referencedClosure(templateIds, id);
  }
}

function referencedTemplateIds(blocks: unknown, puckBlocks: unknown) {
  return [
    ...new Set([
      ...getStoredTemplateIDs(blocks),
      ...linkedTemplateIdsOf(puckBlocks),
    ]),
  ];
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
  const conditions: Prisma.BlockTemplateWhereInput[] = [
    { articleTemplate: null, pageTemplate: null },
  ];

  if (filter?.puck != null) {
    conditions.push({
      puckBlocks:
        filter.puck ? { not: Prisma.DbNull } : { equals: Prisma.DbNull },
    });
  }

  if (filter?.name) {
    conditions.push({
      name: {
        mode: 'insensitive',
        contains: filter.name,
      },
    });
  }

  return { AND: conditions };
}

function getInputTemplateIDs(blocks: BlockContentInput[]): string[] {
  return blocks.flatMap(block => {
    const templateBlock = block[BlockType.BlockTemplate];

    if (templateBlock) {
      return [templateBlock.templateId];
    }

    const nestedBlocks = block[BlockType.FlexBlock]?.blocks
      .map(({ block }) => block)
      .filter((block): block is BlockContentInput => !!block);

    return nestedBlocks ? getInputTemplateIDs(nestedBlocks) : [];
  });
}

type StoredBlock = {
  type?: BlockType;
  templateId?: string;
  blocks?: ({ block?: StoredBlock } | null)[];
};

function getStoredTemplateIDs(blocks: unknown): string[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return (blocks as (StoredBlock | null)[]).flatMap(block => {
    if (block?.type === BlockType.BlockTemplate) {
      return block.templateId ? [block.templateId] : [];
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
