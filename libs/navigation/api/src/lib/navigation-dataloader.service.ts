import {Injectable, Scope} from '@nestjs/common'
import {Navigation, PrismaClient} from '@prisma/client'
import {Primeable, createOptionalsArray} from '@wepublish/utils/api'
import DataLoader from 'dataloader'

@Injectable({
  scope: Scope.REQUEST
})
export class NavigationDataloaderService implements Primeable<Navigation> {
  private dataloader = new DataLoader<string, Navigation | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.navigation.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          }
        }),
        'id'
      ),
    {name: 'NavigationDataLoader'}
  )

  constructor(private prisma: PrismaClient) {}

  public prime(...parameters: Parameters<DataLoader<string, Navigation | null>['prime']>) {
    return this.dataloader.prime(...parameters)
  }

  public load(...parameters: Parameters<DataLoader<string, Navigation | null>['load']>) {
    return this.dataloader.load(...parameters)
  }

  public loadMany(...parameters: Parameters<DataLoader<string, Navigation | null>['loadMany']>) {
    return this.dataloader.loadMany(...parameters)
  }
}
