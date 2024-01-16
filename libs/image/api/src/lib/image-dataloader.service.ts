import {Injectable, Scope} from '@nestjs/common'
import {Image, PrismaClient} from '@prisma/client'
import {Primeable, createOptionalsArray} from '@wepublish/utils/api'
import DataLoader from 'dataloader'

@Injectable({
  scope: Scope.REQUEST
})
export class ImageDataloaderService implements Primeable<Image> {
  private readonly dataloader = new DataLoader<string, Image | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.image.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          },
          include: {
            focalPoint: true
          }
        }),
        'id'
      ),
    {name: 'ImageDataLoader'}
  )

  constructor(private prisma: PrismaClient) {}

  public prime(...parameters: Parameters<DataLoader<string, Image | null>['prime']>) {
    return this.dataloader.prime(...parameters)
  }

  public load(...parameters: Parameters<DataLoader<string, Image | null>['load']>) {
    return this.dataloader.load(...parameters)
  }

  public loadMany(...parameters: Parameters<DataLoader<string, Image | null>['loadMany']>) {
    return this.dataloader.loadMany(...parameters)
  }
}
