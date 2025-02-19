import {Field, InterfaceType} from '@nestjs/graphql'
import {PublicSubscription} from '../subscription.model'

@InterfaceType()
export abstract class HasOptionalSubscription {
  @Field({nullable: true})
  subscriptionId?: string

  @Field(() => PublicSubscription, {nullable: true})
  subscription?: PublicSubscription
}

@InterfaceType()
export abstract class HasSubscription {
  @Field()
  subscriptionId!: string

  @Field(() => PublicSubscription)
  subscription!: PublicSubscription
}
