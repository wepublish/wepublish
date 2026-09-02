import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaymentPeriodicity, SubscriptionEvent } from '@prisma/client';
import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterQrBill,
  MessageChannel,
} from '../channel-enums';
import { MemberPlan } from '@wepublish/member-plan/api';
import { PaymentMethod } from '@wepublish/payment/api';

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity',
});

registerEnumType(SubscriptionEvent, {
  name: 'SubscriptionEvent',
});

@ObjectType()
export class MailTemplateRef {
  @Field()
  id!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class SubscriptionInterval {
  @Field()
  id!: string;

  @Field(() => Int, { nullable: true })
  daysAwayFromEnding?: number;

  @Field(() => MailTemplateRef, { nullable: true })
  mailTemplate!: MailTemplateRef | null;

  @Field(() => [MessageChannel])
  channels!: MessageChannel[];

  @Field(() => LetterAddressPosition)
  addressPosition!: LetterAddressPosition;

  @Field(() => LetterDeliveryProduct)
  deliveryProduct!: LetterDeliveryProduct;

  @Field(() => LetterPrintMode)
  printMode!: LetterPrintMode;

  @Field(() => LetterPrintSpectrum)
  printSpectrum!: LetterPrintSpectrum;

  @Field(() => LetterQrBill)
  qrBill!: LetterQrBill;

  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent;
}

@ObjectType()
export class SubscriptionFlowModel {
  @Field()
  id!: string;

  @Field()
  default!: boolean;

  @Field(() => MemberPlan, { nullable: true })
  memberPlan?: MemberPlan;

  @Field(() => [PaymentMethod])
  paymentMethods!: PaymentMethod[];

  @Field(() => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[];

  @Field(() => [Boolean])
  autoRenewal!: boolean[];

  @Field(() => [SubscriptionInterval])
  intervals!: SubscriptionInterval[];

  @Field(() => Int)
  numberOfSubscriptions!: number;
}

@ArgsType()
export class SubscriptionIntervalCreateInput {
  @Field()
  subscriptionFlowId!: string;

  @Field(() => Int, { nullable: true })
  daysAwayFromEnding?: number;

  @Field({ nullable: true })
  mailTemplateId?: string;

  @Field(() => [MessageChannel], { nullable: true })
  channels?: MessageChannel[];

  @Field(() => LetterAddressPosition, { nullable: true })
  addressPosition?: LetterAddressPosition;

  @Field(() => LetterDeliveryProduct, { nullable: true })
  deliveryProduct?: LetterDeliveryProduct;

  @Field(() => LetterPrintMode, { nullable: true })
  printMode?: LetterPrintMode;

  @Field(() => LetterPrintSpectrum, { nullable: true })
  printSpectrum?: LetterPrintSpectrum;

  @Field(() => LetterQrBill, { nullable: true })
  qrBill?: LetterQrBill;

  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent;
}

@ArgsType()
export class SubscriptionIntervalUpdateInput extends PartialType(
  PickType(SubscriptionIntervalCreateInput, [
    'daysAwayFromEnding',
    'mailTemplateId',
    'channels',
    'addressPosition',
    'deliveryProduct',
    'printMode',
    'printSpectrum',
    'qrBill',
  ] as const),
  ArgsType
) {
  @Field()
  id!: string;
}

@ArgsType()
export class SubscriptionFlowModelCreateInput {
  @Field()
  memberPlanId!: string;

  @Field(() => [String])
  paymentMethodIds!: string[];

  @Field(() => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[];

  @Field(() => [Boolean])
  autoRenewal!: boolean[];
}

@ArgsType()
export class SubscriptionFlowModelUpdateInput extends PartialType(
  OmitType(SubscriptionFlowModelCreateInput, ['memberPlanId'] as const),
  ArgsType
) {
  @Field()
  id!: string;
}
