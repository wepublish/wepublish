import {createOptionalsArray, DataloaderService} from '@wepublish/utils/api'
import {PrismaClient} from '@prisma/client'
import {Payment} from './payment.model'

export class PaymentDataloader extends DataloaderService<Payment> {
  constructor(protected readonly prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      (await this.prisma.payment.findMany({
        where: {id: {in: ids}}
      })) as Payment[],
      'id'
    )
  }
}
