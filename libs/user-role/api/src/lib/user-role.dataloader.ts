import {createOptionalsArray, DataloaderService} from '@wepublish/utils/api'
import {UserRole} from './user-role.model'
import {PrismaClient} from '@prisma/client'

export class UserRoleDataloader extends DataloaderService<UserRole> {
  constructor(protected readonly prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.userRole.findMany({
        where: {id: {in: ids}}
      }),
      'id'
    )
  }
}
