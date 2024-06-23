import {createOptionalsArray, DataloaderService} from '@wepublish/utils/api'
import {
  MetadataProperty,
  Page as PrismaPage,
  PageRevision as PrismaPageRevision,
  PrismaClient
} from '@prisma/client'

export type PageRevisionWithProperties = PrismaPageRevision & {
  properties: MetadataProperty[]
}

export type PageWithRevisions = PrismaPage & {
  draft: PageRevisionWithProperties | null
  pending: PageRevisionWithProperties | null
  published: PageRevisionWithProperties | null
}

export class PageDataloader extends DataloaderService<PageWithRevisions> {
  constructor(protected readonly prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.page.findMany({
        where: {id: {in: ids}},
        include: {
          draft: {
            include: {
              properties: true
            }
          },
          pending: {
            include: {
              properties: true
            }
          },
          published: {
            include: {
              properties: true
            }
          }
        }
      }),
      'id'
    )
  }
}
