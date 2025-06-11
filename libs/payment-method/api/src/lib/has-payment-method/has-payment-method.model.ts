import {Field, InterfaceType} from '@nestjs/graphql'
import {PaymentMethod} from '../payment-method.model'

@InterfaceType()
export abstract class HasOptionalPaymentMethod {
  @Field({nullable: true})
  paymentMethodID?: string

  @Field(() => PaymentMethod, {nullable: true})
  paymentMethod?: PaymentMethod
}

@InterfaceType()
export abstract class HasPaymentMethod {
  @Field()
  paymentMethodID!: string

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod
}

// New Style

@InterfaceType()
export abstract class HasPaymentMethodLc {
  @Field()
  paymentMethodId!: string

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod
}

@InterfaceType()
export abstract class HasOptionalPaymentMethodLc {
  @Field({nullable: true})
  paymentMethodId?: string

  @Field(() => PaymentMethod, {nullable: true})
  paymentMethod?: PaymentMethod
}
