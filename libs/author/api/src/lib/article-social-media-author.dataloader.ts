import { DataLoaderService } from '@wepublish/utils/api';
import { Author, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticleSocialMediaAuthorDataloader extends DataLoaderService<
  Author[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(articleRevisionIds: string[]) {
    const authors = groupBy(
      author => author.revisionId!,
      await this.prisma.articleRevisionSocialMediaAuthor.findMany({
        where: {
          revisionId: {
            in: articleRevisionIds,
          },
        },
        include: {
          author: {
            include: {
              links: true,
            },
          },
        },
      })
    );

    return articleRevisionIds.map(
      revisionId => authors[revisionId]?.map(author => author.author) ?? []
    );
  }
}
