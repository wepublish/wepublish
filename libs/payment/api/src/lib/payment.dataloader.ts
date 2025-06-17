import {createOptionalsArray, DataLoaderService} from '@wepublish/utils/api'
import {Payment, PrismaClient} from '@prisma/client'

export class PaymentDataloader extends DataLoaderService<Payment> {
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
