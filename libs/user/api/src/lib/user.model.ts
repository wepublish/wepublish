import {Directive, Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field()
  @Directive('@external')
  id!: string
}

@ObjectType()
export class PaymentProviderCustomer {
  @Field()
  paymentProviderID!: string

  @Field()
  customerID!: string
}

@InputType()
export class PaymentProviderCustomerInput {
  @Field()
  paymentProviderID!: string

  @Field()
  customerID!: string
}
