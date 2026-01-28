import { Field, InterfaceType } from '@nestjs/graphql';
import { Paywall } from '../paywall.model';

@InterfaceType()
export abstract class HasOptionalPaywall {
  @Field({ nullable: true })
  paywallId?: string;

  @Field(() => Paywall, { nullable: true })
  paywall?: Paywall;
}

@InterfaceType()
export abstract class HasPaywall {
  @Field()
  paywallId!: string;

  @Field(() => Paywall)
  paywall!: Paywall;
}
