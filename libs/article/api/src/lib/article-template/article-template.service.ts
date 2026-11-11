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
  ArticleTemplateListArgs,
  ArticleTemplateSort,
  CreateArticleTemplateInput,
  UpdateArticleTemplateInput,
} from './article-template.model';

@Injectable()
export class ArticleTemplateService {
  constructor(
    private prisma: PrismaClient,
    @Inject(forwardRef(() => BlockTemplateService))
    private blockTemplateService: BlockTemplateService
  ) {}

  public async getArticleTemplates({
    filter,
    sort = ArticleTemplateSort.Name,
    order = SortOrder.Ascending,
    cursorId,
    skip = 0,
    take = 10,
  }: ArticleTemplateListArgs) {
    const where = createTemplateFilter(filter);
    const orderBy = createTemplateOrder(sort, order);

    const [totalCount, articleTemplates] = await Promise.all([
      this.prisma.articleTemplate.count({
        where,
      }),
      this.prisma.articleTemplate.findMany({
        where,
        orderBy,
        skip,
        take: getMaxTake(take) + 1,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = articleTemplates.slice(0, getMaxTake(take));
    const firstArticleTemplate = nodes[0];
    const lastArticleTemplate = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: articleTemplates.length > nodes.length,
        startCursor: firstArticleTemplate?.id,
        endCursor: lastArticleTemplate?.id,
      },
    };
  }

  public getArticleTemplateById(id: string) {
    return this.prisma.articleTemplate.findUnique({
      where: {
        id,
      },
    });
  }

  public async createArticleTemplate({
    name,
    blocks,
    metadata,
  }: CreateArticleTemplateInput) {
    const mappedBlocks = await this.blockTemplateService.mapBlocks(blocks);

    try {
      return await this.prisma.articleTemplate.create({
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

  public async updateArticleTemplate({
    id,
    name,
    blocks,
    metadata,
  }: UpdateArticleTemplateInput) {
    const { blockTemplateId } =
      await this.prisma.articleTemplate.findUniqueOrThrow({
        where: {
          id,
        },
      });

    const mappedBlocks = await this.blockTemplateService.mapBlocks(
      blocks,
      blockTemplateId
    );

    try {
      return await this.prisma.articleTemplate.update({
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

  public async deleteArticleTemplate(id: string) {
    const articleTemplate = await this.prisma.articleTemplate.findUniqueOrThrow(
      {
        where: {
          id,
        },
      }
    );

    const blockTemplate = await this.prisma.blockTemplate.delete({
      where: {
        id: articleTemplate.blockTemplateId,
      },
    });

    return { ...articleTemplate, blockTemplate };
  }
}
