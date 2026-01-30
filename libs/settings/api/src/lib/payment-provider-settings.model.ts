import {
  Field,
  ObjectType,
  InputType,
  ArgsType,
  registerEnumType,
} from '@nestjs/graphql';

import {
  PaymentProviderType,
  PayrexxPSP,
  PayrexxPM,
  StripePaymentMethod,
  PaymentMethodMollie,
} from '@prisma/client';

import GraphQLJSON from 'graphql-type-json';

registerEnumType(PaymentProviderType, { name: 'PaymentProviderType' });
registerEnumType(PayrexxPSP, { name: 'PayrexxPSP' });
registerEnumType(PayrexxPM, { name: 'PayrexxPM' });
registerEnumType(StripePaymentMethod, { name: 'StripePaymentMethod' });
registerEnumType(PaymentMethodMollie, { name: 'PaymentMethodMollie' });

@ObjectType()
export class SettingPaymentProvider {
  @Field(type => String)
  id!: string;

  @Field(type => Date)
  createdAt!: Date;

  @Field(type => Date)
  modifiedAt!: Date;

  @Field(type => PaymentProviderType)
  type!: PaymentProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => Boolean, { nullable: true })
  offSessionPayments?: boolean;

  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;

  @Field(() => [StripePaymentMethod], { nullable: true })
  stripe_methods?: StripePaymentMethod[];

  @Field(() => [PayrexxPSP], { nullable: true })
  payrexx_psp?: PayrexxPSP[];

  @Field(() => [PayrexxPM], { nullable: true })
  payrexx_pm?: PayrexxPM[];

  @Field(() => [PaymentMethodMollie], { nullable: true })
  mollie_methods?: PaymentMethodMollie[];

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
export class SettingPaymentProviderFilter {
  @Field(type => String, { nullable: true })
  id?: string;

  @Field(type => PaymentProviderType, { nullable: true })
  type?: PaymentProviderType;

  @Field(type => String, { nullable: true })
  name?: string;
}

@InputType()
export class CreateSettingPaymentProviderInput {
  @Field(type => String)
  id!: string;

  @Field(type => PaymentProviderType)
  type!: PaymentProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => Boolean, { nullable: true })
  offSessionPayments?: boolean;

  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;

  @Field(() => [StripePaymentMethod], { nullable: true })
  stripe_methods?: StripePaymentMethod[];

  @Field(() => [PayrexxPSP], { nullable: true })
  payrexx_psp?: PayrexxPSP[];

  @Field(() => [PayrexxPM], { nullable: true })
  payrexx_pm?: PayrexxPM[];

  @Field(() => [PaymentMethodMollie], { nullable: true })
  mollie_methods?: PaymentMethodMollie[];

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

@ArgsType()
export class UpdateSettingPaymentProviderInput {
  @Field(type => String)
  id!: string;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => Boolean, { nullable: true })
  offSessionPayments?: boolean;

  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;
  /** hide sensitive filds
  @Field(type => String, { nullable: true })
  apiKey?: string;
 **/

  @Field(() => [StripePaymentMethod], { nullable: true })
  stripe_methods?: StripePaymentMethod[];

  @Field(() => [PayrexxPSP], { nullable: true })
  payrexx_psp?: PayrexxPSP[];

  @Field(() => [PayrexxPM], { nullable: true })
  payrexx_pm?: PayrexxPM[];

  @Field(() => [PaymentMethodMollie], { nullable: true })
  mollie_methods?: PaymentMethodMollie[];

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
