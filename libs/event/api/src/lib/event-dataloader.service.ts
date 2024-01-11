import {Injectable, Scope} from '@nestjs/common'
import {Event, PrismaClient} from '@prisma/client'
import {Primeable, createOptionalsArray} from '@wepublish/utils/api'
import DataLoader from 'dataloader'

@Injectable({
  scope: Scope.REQUEST
})
export class EventDataloaderService implements Primeable<Event> {
  private readonly dataloader = new DataLoader<string, Event | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.event.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          }
        }),
        'id'
      ),
    {name: 'EventDataLoader'}
  )

  constructor(private prisma: PrismaClient) {}

  public prime(...parameters: Parameters<(typeof this.dataloader)['prime']>) {
    return this.dataloader.prime(...parameters)
  }

  public load(...parameters: Parameters<(typeof this.dataloader)['load']>) {
    return this.dataloader.load(...parameters)
  }

  public loadMany(...parameters: Parameters<(typeof this.dataloader)['loadMany']>) {
    return this.dataloader.loadMany(...parameters)
  }
}
