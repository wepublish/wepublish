import { Injectable, Scope } from '@nestjs/common';
import { Comment, PrismaClient } from '@prisma/client';
import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';

@Injectable({
  scope: Scope.REQUEST,
})
export class CommentDataloaderService extends DataLoaderService<Comment> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.comment.findMany({
        where: {
          id: {
            in: ids as string[],
          },
        },
      }),
      'id'
    );
  }
}
