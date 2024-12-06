import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Subscription} from '../subscription.model'

@InterfaceType()
export abstract class HasOptionalSubscription {
  @Field(() => ID, {nullable: true})
  subscriptionId?: string

  @Field(() => Subscription, {nullable: true})
  subscription?: Subscription
}

@InterfaceType()
export abstract class HasSubscription {
  @Field(() => ID)
  subscriptionId!: string

  @Field(() => Subscription)
  subscription!: Subscription
}
