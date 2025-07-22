import {Injectable, Scope} from '@nestjs/common'
import {PageRevision, PrismaClient} from '@prisma/client'
import {Primeable} from '@wepublish/utils/api'
import DataLoader from 'dataloader'

type RevisionMap = Partial<{
  draft: PageRevision
  pending: PageRevision
  published: PageRevision
}>

@Injectable({
  scope: Scope.REQUEST
})
export class PageRevisionDataloaderService implements Primeable<RevisionMap> {
  private readonly dataloader = new DataLoader<string, RevisionMap>(
    async (pageIds: readonly string[]) => {
      const revisionPromises = []

      for (const pageId of pageIds) {
        revisionPromises.push(
          this.prisma.pageRevision.findMany({
            where: {
              pageId,
              archivedAt: null
            },
            take: 3,
            orderBy: [
              {
                publishedAt: 'desc'
              },
              {
                createdAt: 'desc'
              }
            ]
          })
        )
      }

      const revisions = (await Promise.all(revisionPromises)).flat()

      return pageIds.map((pageId): RevisionMap => {
        const published = revisions.find(
          rev => rev.pageId === pageId && rev.publishedAt && new Date() > new Date(rev.publishedAt)
        )

        const draft = revisions.find(rev => rev.pageId === pageId && !rev.publishedAt)
        const pending = revisions.find(
          rev => rev.pageId === pageId && rev.publishedAt && new Date(rev.publishedAt) > new Date()
        )

        return {draft, pending, published}
      })
    },
    {name: 'PageRevisionDataloader'}
  )

  constructor(private prisma: PrismaClient) {}

  public prime(...parameters: Parameters<DataLoader<string, RevisionMap>['prime']>) {
    return this.dataloader.prime(...parameters)
  }

  public load(...parameters: Parameters<DataLoader<string, RevisionMap>['load']>) {
    return this.dataloader.load(...parameters)
  }

  public loadMany(...parameters: Parameters<DataLoader<string, RevisionMap>['loadMany']>) {
    return this.dataloader.loadMany(...parameters)
  }
}
