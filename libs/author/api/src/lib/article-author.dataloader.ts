import { DataLoaderService } from '@wepublish/utils/api';
import {
  Author,
  ArticleRevisionAuthor as PrismaArticleRevisionAuthor,
  PrismaClient,
} from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

export type ArticleRevisionAuthorWithAuthor = PrismaArticleRevisionAuthor & {
  author: Author;
};

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticleAuthorDataloader extends DataLoaderService<
  ArticleRevisionAuthorWithAuthor[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(articleRevisionIds: string[]) {
    const authors = groupBy(
      author => author.revisionId!,
      await this.prisma.articleRevisionAuthor.findMany({
        relationLoadStrategy: 'join',
        where: {
          revisionId: {
            in: articleRevisionIds,
          },
        },
        orderBy: {
          position: 'asc',
        },
        include: {
          author: true,
        },
      })
    );

    return articleRevisionIds.map(revisionId => authors[revisionId] ?? []);
  }
}
