import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Tag } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuthorTagDataloader extends DataLoaderService<Tag[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(authorIds: string[]) {
    const tags = groupBy(
      tag => tag.authorId!,
      await this.prisma.taggedAuthors.findMany({
        where: {
          authorId: {
            in: authorIds,
          },
        },
        include: {
          tag: true,
        },
      })
    );

    return authorIds.map(authorId => tags[authorId]?.map(tag => tag.tag) ?? []);
  }
}
