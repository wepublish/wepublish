import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  BlockTemplateService,
  createTemplateFilter,
  createTemplateOrder,
  throwOnDuplicateName,
} from '@wepublish/block-content/api';
import { getMaxTake, SortOrder } from '@wepublish/utils/api';
import {
  PageTemplateListArgs,
  PageTemplateSort,
  CreatePageTemplateInput,
  UpdatePageTemplateInput,
} from './page-template.model';

@Injectable()
export class PageTemplateService {
  constructor(
    private prisma: PrismaClient,
    @Inject(forwardRef(() => BlockTemplateService))
    private blockTemplateService: BlockTemplateService
  ) {}

  public async getPageTemplates({
    filter,
    sort = PageTemplateSort.Name,
    order = SortOrder.Ascending,
    cursorId,
    skip = 0,
    take = 10,
  }: PageTemplateListArgs) {
    const where = createTemplateFilter(filter);
    const orderBy = createTemplateOrder(sort, order);

    const [totalCount, pageTemplates] = await Promise.all([
      this.prisma.pageTemplate.count({
        where,
      }),
      this.prisma.pageTemplate.findMany({
        where,
        orderBy,
        skip,
        take: getMaxTake(take) + 1,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = pageTemplates.slice(0, getMaxTake(take));
    const firstPageTemplate = nodes[0];
    const lastPageTemplate = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: pageTemplates.length > nodes.length,
        startCursor: firstPageTemplate?.id,
        endCursor: lastPageTemplate?.id,
      },
    };
  }

  public getPageTemplateById(id: string) {
    return this.prisma.pageTemplate.findUnique({
      where: {
        id,
      },
    });
  }

  public async createPageTemplate({
    name,
    blocks,
    metadata,
  }: CreatePageTemplateInput) {
    const mappedBlocks = await this.blockTemplateService.mapBlocks(blocks);

    try {
      return await this.prisma.pageTemplate.create({
        data: {
          metadata: metadata as unknown as Prisma.InputJsonValue,
          blockTemplate: {
            create: {
              name,
              blocks: mappedBlocks,
            },
          },
        },
      });
    } catch (error) {
      throwOnDuplicateName(error, name);
    }
  }

  public async updatePageTemplate({
    id,
    name,
    blocks,
    metadata,
  }: UpdatePageTemplateInput) {
    const { blockTemplateId } =
      await this.prisma.pageTemplate.findUniqueOrThrow({
        where: {
          id,
        },
      });

    const mappedBlocks = await this.blockTemplateService.mapBlocks(
      blocks,
      blockTemplateId
    );

    try {
      return await this.prisma.pageTemplate.update({
        where: {
          id,
        },
        data: {
          metadata: metadata as unknown as Prisma.InputJsonValue,
          blockTemplate: {
            update: {
              name,
              blocks: mappedBlocks,
            },
          },
        },
      });
    } catch (error) {
      throwOnDuplicateName(error, name);
    }
  }

  public async deletePageTemplate(id: string) {
    const pageTemplate = await this.prisma.pageTemplate.findUniqueOrThrow({
      where: {
        id,
      },
    });

    const blockTemplate = await this.prisma.blockTemplate.delete({
      where: {
        id: pageTemplate.blockTemplateId,
      },
    });

    return { ...pageTemplate, blockTemplate };
  }
}
