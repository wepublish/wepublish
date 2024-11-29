import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {AuthorDataloaderService} from '@wepublish/author/api'
import {PrimeDataLoader} from '@wepublish/utils/api'

@Injectable()
export class ArticleRevisionService {
  constructor(private prisma: PrismaClient) {}

  async getProperties(revisionId: string) {
    return this.prisma.metadataProperty.findMany({
      where: {
        articleRevisionId: revisionId
      }
    })
  }

  @PrimeDataLoader(AuthorDataloaderService)
  async getSocialMediaAuthors(revisionId: string) {
    return this.prisma.author.findMany({
      where: {
        articlesAsSocialMediaAuthor: {
          some: {
            revisionId
          }
        }
      }
    })
  }

  @PrimeDataLoader(AuthorDataloaderService)
  async getAuthors(revisionId: string) {
    return this.prisma.author.findMany({
      where: {
        articlesAsAuthor: {
          some: {
            revisionId
          }
        }
      }
    })
  }
}
