import {
  Field,
  ObjectType,
  ArgsType,
  registerEnumType,
  PartialType,
  PickType,
  OmitType,
  InputType,
} from '@nestjs/graphql';

import {
  PaymentProviderType,
  PayrexxPSP,
  PayrexxPM,
  StripePaymentMethod,
  MolliePaymentMethod,
} from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(PaymentProviderType, { name: 'PaymentProviderType' });
registerEnumType(PayrexxPSP, { name: 'PayrexxPSP' });
registerEnumType(PayrexxPM, { name: 'PayrexxPM' });
registerEnumType(StripePaymentMethod, { name: 'StripePaymentMethod' });
registerEnumType(MolliePaymentMethod, { name: 'PaymentMethodMollie' });

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingPaymentProvider extends SettingProvider {
  @Field(type => PaymentProviderType)
  type!: PaymentProviderType;

  @Field(type => Boolean, { nullable: true })
  offSessionPayments?: boolean;

  /** hide sensitive filds
  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

 @Field(type => String, { nullable: true })
  apiKey?: string;
 **/

  @Field(() => [StripePaymentMethod], { nullable: true })
  stripe_methods?: StripePaymentMethod[];

  @Field(() => [PayrexxPSP], { nullable: true })
  payrexx_psp?: PayrexxPSP[];

  @Field(() => [PayrexxPM], { nullable: true })
  payrexx_pm?: PayrexxPM[];

  @Field(() => [MolliePaymentMethod], { nullable: true })
  mollie_methods?: MolliePaymentMethod[];

  @Field(type => String, { nullable: true })
  payrexx_instancename?: string;

  @Field(type => String, { nullable: true })
  payrexx_vatrate?: string;

  @Field(type => Number, { nullable: true })
  bexio_userId?: number;

  @Field(type => Number, { nullable: true })
  bexio_countryId?: number;

  @Field(type => String, { nullable: true })
  bexio_invoiceTemplateNewMembership?: string;

  @Field(type => String, { nullable: true })
  bexio_invoiceTemplateRenewalMembership?: string;

  @Field(type => Number, { nullable: true })
  bexio_unitId?: number;

  @Field(type => Number, { nullable: true })
  bexio_taxId?: number;

  @Field(type => Number, { nullable: true })
  bexio_accountId?: number;

  @Field(type => String, { nullable: true })
  bexio_invoiceTitleNewMembership?: string;

  @Field(type => String, { nullable: true })
  bexio_invoiceTitleRenewalMembership?: string;

  @Field(type => String, { nullable: true })
  bexio_invoiceMailSubjectNewMembership?: string;

  @Field(type => String, { nullable: true })
  bexio_invoiceMailBodyNewMembership?: string;

  @Field(type => String, { nullable: true })
  bexio_invoiceMailSubjectRenewalMembership?: string;

  @Field(type => String, { nullable: true })
  bexio_invoiceMailBodyRenewalMembership?: string;

  @Field(type => Boolean, { nullable: true })
  bexio_markInvoiceAsOpen?: boolean;

  @Field(type => String, { nullable: true })
  mollie_apiBaseUrl?: string;
}

@InputType()
export class SettingPaymentProviderFilter extends PartialType(
  PickType(SettingPaymentProvider, ['id', 'type', 'name'] as const, InputType),
  InputType
) {}

@ArgsType()
export class CreateSettingPaymentProviderInput extends OmitType(
  SettingPaymentProvider,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field(type => String)
  id!: string;

  @Field(type => PaymentProviderType)
  type!: PaymentProviderType;

  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;
}

@ArgsType()
export class UpdateSettingPaymentProviderInput extends PartialType(
  OmitType(CreateSettingPaymentProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {}
