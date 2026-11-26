import { ArgsType, Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Invoice, PublicSubscription } from '@wepublish/membership/api';

export enum GiftCodeRedemptionAction {
  paidInvoice = 'paidInvoice',
  extendedSubscription = 'extendedSubscription',
  createdSubscription = 'createdSubscription',
}

registerEnumType(GiftCodeRedemptionAction, {
  name: 'GiftCodeRedemptionAction',
  valuesMap: {
    paidInvoice: {
      description:
        'The code paid the open invoice of an existing subscription.',
    },
    extendedSubscription: {
      description: 'The code paid the next period of an existing subscription.',
    },
    createdSubscription: {
      description:
        'The code started a new subscription and paid its first period.',
    },
  },
});

@ArgsType()
export class RedeemGiftCodeArgs {
  @Field()
  code!: string;
}

@ObjectType()
export class GiftCodeRedemption {
  @Field(() => GiftCodeRedemptionAction)
  action!: GiftCodeRedemptionAction;

  @Field(() => PublicSubscription)
  subscription!: PublicSubscription;

  @Field(() => Invoice)
  invoice!: Invoice;
}
