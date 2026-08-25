import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterQrBill,
  MailTemplateContext,
} from '@prisma/client';

registerEnumType(LetterAddressPosition, {
  name: 'LetterAddressPosition',
  description: 'Where the address window sits on the printed sheet.',
});

registerEnumType(LetterDeliveryProduct, {
  name: 'LetterDeliveryProduct',
});

registerEnumType(LetterPrintMode, {
  name: 'LetterPrintMode',
});

registerEnumType(LetterPrintSpectrum, {
  name: 'LetterPrintSpectrum',
});

registerEnumType(LetterQrBill, {
  name: 'LetterQrBill',
  description:
    'Whether a Swiss QR bill is printed, and where. It fills a fixed slot, it is not a placeholder.',
});

@ObjectType()
export class LetterTemplateModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  htmlContent!: string;

  @Field(() => MailTemplateContext, { nullable: true })
  context?: MailTemplateContext;

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
}

@InputType()
export class LetterTemplateInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  htmlContent!: string;

  @Field(() => MailTemplateContext, { nullable: true })
  context?: MailTemplateContext;

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
}

@InputType()
export class LetterTemplatePreviewInput {
  @Field({ nullable: true })
  letterTemplateId?: string;

  @Field({ nullable: true })
  htmlContent?: string;

  @Field(() => MailTemplateContext, { nullable: true })
  context?: MailTemplateContext;

  @Field(() => LetterAddressPosition, { nullable: true })
  addressPosition?: LetterAddressPosition;

  @Field(() => LetterQrBill, { nullable: true })
  qrBill?: LetterQrBill;

  @Field({
    nullable: true,
    description:
      'Render with the data of this subscription instead of samples.',
  })
  subscriptionId?: string;
}

@ObjectType()
export class LetterTemplatePreviewModel {
  @Field({ description: 'The rendered pdf, base64 encoded.' })
  pdf!: string;

  @Field(() => [String], {
    description: 'Placeholders used by the template that resolve to nothing.',
  })
  missingPlaceholders!: string[];
}

@ObjectType()
export class LetterProviderModel {
  @Field()
  name!: string;
}
