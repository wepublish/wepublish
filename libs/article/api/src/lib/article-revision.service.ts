import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {PrimeDataLoader} from '@wepublish/utils/api'
import {AuthorDataloader} from '@wepublish/author/api'

@Injectable()
export class ArticleRevisionService {
  constructor(private prisma: PrismaClient) {}

  async getProperties(revisionId: string, includePrivate: boolean) {
    return this.prisma.metadataProperty.findMany({
      where: {
        public: includePrivate ? undefined : true,
        articleRevisionId: revisionId
      }
    })
  }

  @PrimeDataLoader(AuthorDataloader)
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

  @PrimeDataLoader(AuthorDataloader)
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
