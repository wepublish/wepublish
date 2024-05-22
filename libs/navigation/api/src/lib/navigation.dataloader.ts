import {PrismaClient, Navigation} from '@prisma/client'
import {createOptionalsArray, DataloaderService} from '@wepublish/utils/api'

export class NavigationDataloader extends DataloaderService<Navigation> {
  constructor(protected readonly prisma: PrismaClient) {
    super()
  }

  async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.navigation.findMany({
        where: {id: {in: ids}}
      }),
      'id'
    )
  }
}
