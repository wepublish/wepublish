import {createOptionalsArray, DataLoaderService} from '@wepublish/utils/api'
import {PrismaClient} from '@prisma/client'
import {PaymentMethod} from './payment-method.model'
import {Injectable} from '@nestjs/common'

@Injectable()
export class PaymentMethodDataloader extends DataLoaderService<PaymentMethod> {
  constructor(protected prisma: PrismaClient) {
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
