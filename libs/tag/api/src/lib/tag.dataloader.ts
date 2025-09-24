import {createOptionalsArray, DataLoaderService} from '@wepublish/utils/api'
import {PrismaClient} from '@prisma/client'
import {Tag} from './tag.model'
import {Injectable, Scope} from '@nestjs/common'

@Injectable({scope: Scope.REQUEST})
export class TagDataloader extends DataLoaderService<Tag> {
  constructor(private prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      (await this.prisma.tag.findMany({
        where: {id: {in: ids}}
      })) as unknown as Tag[],
      'id'
    )
  }
}
