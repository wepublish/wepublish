import {Injectable, Scope} from '@nestjs/common'
import {ArticleRevision, PrismaClient} from '@prisma/client'
import {Primeable} from '@wepublish/utils/api'
import DataLoader from 'dataloader'

type RevisionMap = Partial<{
  draft: ArticleRevision
  pending: ArticleRevision
  published: ArticleRevision
}>

@Injectable({
  scope: Scope.REQUEST
})
export class ArticleRevisionDataloaderService implements Primeable<RevisionMap> {
  private dataloader = new DataLoader<string, RevisionMap>(
    async (articleIds: readonly string[]) => {
      const revisionPromises = []

      for (const articleId of articleIds) {
        revisionPromises.push(
          this.prisma.articleRevision.findMany({
            where: {
              articleId,
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
      return articleIds.map((articleId): RevisionMap => {
        const published = revisions.find(
          rev =>
            rev.articleId === articleId && rev.publishedAt && new Date() > new Date(rev.publishedAt)
        )

        const draft = revisions.find(rev => rev.articleId === articleId && !rev.publishedAt)
        const pending = revisions.find(
          rev =>
            rev.articleId === articleId && rev.publishedAt && new Date(rev.publishedAt) > new Date()
        )

        return {draft, pending, published}
      })
    },
    {name: 'ArticleRevisionDataloader'}
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
