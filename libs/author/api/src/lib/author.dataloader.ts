import {createOptionalsArray, DataloaderService} from '@wepublish/utils/api'
import {Author} from './author.model'
import {PrismaClient} from '@prisma/client'

export class AuthorDataloader extends DataloaderService<Author> {
  constructor(protected readonly prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      (await this.prisma.author.findMany({
        where: {id: {in: ids}}
      })) as unknown as Author[],
      'id'
    )
  }
}
