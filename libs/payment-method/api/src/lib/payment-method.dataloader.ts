import {createOptionalsArray, DataloaderService} from '@wepublish/utils/api'
import {PrismaClient} from '@prisma/client'
import {PaymentMethod} from './payment-method.model'

export class PaymentMethodDataloader extends DataloaderService<PaymentMethod> {
  constructor(protected readonly prisma: PrismaClient) {
    super()
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.paymentMethod.findMany({
        where: {id: {in: ids}}
      }),
      'id'
    )
  }
}
