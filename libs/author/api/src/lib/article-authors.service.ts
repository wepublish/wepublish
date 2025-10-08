import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { AuthorDataloaderService } from './author-dataloader.service';

@Injectable()
export class ArticleAuthorsService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(AuthorDataloaderService)
  async getSocialMediaAuthors(revisionId: string) {
    return this.prisma.author.findMany({
      where: {
        articlesAsSocialMediaAuthor: {
          some: {
            revisionId,
          },
        },
      },
      include: {
        links: true,
      },
    });
  }

  @PrimeDataLoader(AuthorDataloaderService)
  async getAuthors(revisionId: string) {
    return this.prisma.author.findMany({
      where: {
        articlesAsAuthor: {
          some: {
            revisionId,
          },
        },
      },
      include: {
        links: true,
      },
    });
  }
}
