import {Injectable, Scope} from '@nestjs/common'
import {Comment, PrismaClient} from '@prisma/client'
import {Primeable, createOptionalsArray} from '@wepublish/utils/api'
import DataLoader from 'dataloader'

@Injectable({
  scope: Scope.REQUEST
})
export class CommentDataloaderService implements Primeable<Comment> {
  private readonly dataloader = new DataLoader<string, Comment | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.comment.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          }
        }),
        'id'
      ),
    {name: 'CommentDataLoader'}
  )

  constructor(private prisma: PrismaClient) {}

  public prime(...parameters: Parameters<DataLoader<string, Comment | null>['prime']>) {
    return this.dataloader.prime(...parameters)
  }

  public load(...parameters: Parameters<DataLoader<string, Comment | null>['load']>) {
    return this.dataloader.load(...parameters)
  }

  public loadMany(...parameters: Parameters<DataLoader<string, Comment | null>['loadMany']>) {
    return this.dataloader.loadMany(...parameters)
  }
}
