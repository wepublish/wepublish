import { Field, InterfaceType } from '@nestjs/graphql';
import { PublicSubscription } from '../subscription.model';

@InterfaceType()
export abstract class HasOptionalSubscription {
  @Field({ nullable: true })
  subscriptionID?: string;

  @Field(() => PublicSubscription, { nullable: true })
  subscription?: PublicSubscription;
}

@InterfaceType()
export abstract class HasSubscription {
  @Field()
  subscriptionID!: string;

  @Field(() => PublicSubscription)
  subscription!: PublicSubscription;
}

@InterfaceType()
export abstract class HasOptionalSubscriptionLc {
  @Field({ nullable: true })
  subscriptionId?: string;

  @Field(() => PublicSubscription, { nullable: true })
  subscription?: PublicSubscription;
}

@InterfaceType()
export abstract class HasSubscriptionLc {
  @Field()
  subscriptionId!: string;

  @Field(() => PublicSubscription)
  subscription!: PublicSubscription;
}
