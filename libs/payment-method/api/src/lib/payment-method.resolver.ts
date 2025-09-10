import {Query, Resolver} from '@nestjs/graphql'
import {CanGetPaymentMethods} from '@wepublish/permissions'
import {PrismaClient} from '@prisma/client'
import {Permissions} from '@wepublish/permissions/api'
import {PaymentMethod} from './payment-method.model'

@Resolver(() => PaymentMethod)
export class PaymentMethodResolver {
  constructor(private prismaService: PrismaClient) {}

  @Permissions(CanGetPaymentMethods)
  @Query(() => [PaymentMethod], {
    description: `Returns all payment methods`
  })
  async paymentMethods() {
    return this.prismaService.paymentMethod.findMany({
      include: {
        image: true
      }
    })
  }
}
