import {Injectable, Scope} from '@nestjs/common'
import {Author, PrismaClient} from '@prisma/client'
import {Primeable, createOptionalsArray} from '@wepublish/utils/api'
import DataLoader from 'dataloader'

@Injectable({
  scope: Scope.REQUEST
})
export class AuthorDataloaderService implements Primeable<Author> {
  private readonly dataloader = new DataLoader<string, Author | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.author.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          }
        }),
        'id'
      ),
    {name: 'AuthorDataLoader'}
  )

  constructor(private prisma: PrismaClient) {}

  public prime(...parameters: Parameters<DataLoader<string, Author | null>['prime']>) {
    return this.dataloader.prime(...parameters)
  }

  public load(...parameters: Parameters<DataLoader<string, Author | null>['load']>) {
    return this.dataloader.load(...parameters)
  }

  public loadMany(...parameters: Parameters<DataLoader<string, Author | null>['loadMany']>) {
    return this.dataloader.loadMany(...parameters)
  }
}
