import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, AuthorsLinks } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuthorLinkDataloader extends DataLoaderService<AuthorsLinks[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(authorIds: string[]) {
    const links = groupBy(
      link => link.authorId!,
      await this.prisma.authorsLinks.findMany({
        where: {
          authorId: {
            in: authorIds,
          },
        },
      })
    );

    return authorIds.map(authorId => links[authorId] ?? []);
  }
}
