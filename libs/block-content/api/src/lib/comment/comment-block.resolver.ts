import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CommentBlock } from './comment-block.model';
import { Image } from '@wepublish/image/api';
import { PrismaClient } from '@prisma/client';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { CommentDataloaderService } from '@wepublish/comments/api';

@Resolver(() => CommentBlock)
export class CommentBlockResolver {
  constructor(private prisma: PrismaClient) {}

  @ResolveField(() => Image, { nullable: true })
  @PrimeDataLoader(CommentDataloaderService)
  public comments(@Parent() { filter }: CommentBlock) {
    return this.prisma.comment.findMany({
      where: {
        itemID: filter.item ?? '',
        OR: [
          {
            tags: {
              some: {
                tagId: {
                  in: filter.tags ?? [],
                },
              },
            },
          },
          {
            id: {
              in: filter.comments ?? [],
            },
          },
        ],
      },
      include: {
        revisions: { orderBy: { createdAt: 'asc' } },
      },
    });
  }
}
