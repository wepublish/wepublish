import {PrismaClient, Navigation} from '@prisma/client'
import {createOptionalsArray, DataLoaderService} from '@wepublish/utils/api'

export class NavigationDataLoader extends DataLoaderService<Navigation> {
  constructor(protected readonly prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.navigation.findMany({
        where: {id: {in: ids}}
      }),
      'id'
    )
  }
}
