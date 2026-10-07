import { ArgsType, Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { PaymentPeriodicity } from '@prisma/client';

import { ActionMailNoMailReason } from './action-mail-reason';

registerEnumType(ActionMailNoMailReason, { name: 'ActionMailNoMailReason' });

@ObjectType({
  description:
    'The mail an admin action in the editor would send to the user, or why it sends none, so the editor can ask the admin before running the action.',
})
export class ActionMail {
  @Field({
    description:
      'The SubscriptionEvent or UserEvent of the mail, e.g. SUBSCRIBE or ACCOUNT_CREATION.',
  })
  event!: string;

  @Field({ nullable: true, description: 'Set when a mail would be sent.' })
  mailTemplateId?: string;

  @Field({ nullable: true, description: 'Set when a mail would be sent.' })
  mailTemplateName?: string;

  @Field(() => ActionMailNoMailReason, {
    nullable: true,
    description: 'Set when no mail would be sent.',
  })
  noMailReason?: ActionMailNoMailReason;
}

@ArgsType()
export class SubscriptionCreationMailArgs {
  @Field()
  memberPlanID!: string;

  @Field()
  paymentMethodID!: string;

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity;

  @Field()
  autoRenew!: boolean;
}
