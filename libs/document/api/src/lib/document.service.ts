import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  SortOrder,
} from '@wepublish/utils/api';
import {
  DocumentFilter,
  DocumentListArgs,
  DocumentSort,
  UpdateDocumentInput,
  UploadDocumentInput,
} from './document.model';
import { DocumentUploadService } from './document-upload.service';

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaClient,
    private upload: DocumentUploadService
  ) {}

  async getDocuments({
    filter,
    cursorId,
    sort = DocumentSort.CreatedAt,
    order = SortOrder.Descending,
    take = 10,
    skip,
  }: DocumentListArgs) {
    const orderBy = createDocumentOrder(sort, order);
    const where = createDocumentFilter(filter ?? {});

    const [totalCount, documents] = await Promise.all([
      this.prisma.document.count({
        where,
        orderBy,
      }),
      this.prisma.document.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = documents.slice(0, getMaxTake(take));
    const firstDocument = nodes[0];
    const lastDocument = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = documents.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstDocument?.id,
        endCursor: lastDocument?.id,
      },
    };
  }

  async updateDocument({ id, ...input }: UpdateDocumentInput) {
    return this.prisma.document.update({
      where: { id },
      data: { ...input },
    });
  }

  async createDocument(input: UploadDocumentInput) {
    return this.upload.uploadDocument(input);
  }

  async deleteDocument(id: string) {
    return this.upload.deleteDocument(id);
  }
}

export const createDocumentOrder = (
  field: DocumentSort,
  sortOrder: SortOrder
): Prisma.DocumentFindManyArgs['orderBy'] => {
  switch (field) {
    case DocumentSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case DocumentSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createTitleFilter = (
  filter: Partial<DocumentFilter>
): Prisma.DocumentWhereInput => {
  if (filter?.title) {
    return {
      OR: [
        {
          title: {
            contains: filter.title,
            mode: 'insensitive',
          },
        },
        {
          filename: {
            contains: filter.title,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  return {};
};

export const createDocumentFilter = (
  filter: Partial<DocumentFilter>
): Prisma.DocumentWhereInput => ({
  AND: [createTitleFilter(filter)],
});
