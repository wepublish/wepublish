import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Tag } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class CommentTagDataloader extends DataLoaderService<Tag[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(commentIds: string[]) {
    const tags = groupBy(
      tag => tag.commentId!,
      await this.prisma.taggedComments.findMany({
        where: {
          commentId: {
            in: commentIds,
          },
        },
        include: {
          tag: true,
        },
      })
    );

    return commentIds.map(
      commentId => tags[commentId]?.map(tag => tag.tag) ?? []
    );
  }
}
