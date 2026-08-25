import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { QrBillReferenceType } from '@prisma/client';

registerEnumType(QrBillReferenceType, {
  name: 'QrBillReferenceType',
  description:
    'How a QR bill references the invoice. QRR needs a QR-IBAN, SCOR a normal one.',
});

@ObjectType()
export class OrganisationSettings {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  street?: string;

  @Field({ nullable: true })
  number?: string;

  @Field({ nullable: true })
  zip?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({
    nullable: true,
    description: 'The account a QR bill is paid into. Stored encrypted.',
  })
  iban?: string;

  @Field(() => QrBillReferenceType)
  referenceType!: QrBillReferenceType;
}

@InputType()
export class OrganisationSettingsInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  street?: string;

  @Field({ nullable: true })
  number?: string;

  @Field({ nullable: true })
  zip?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  iban?: string;

  @Field(() => QrBillReferenceType, { nullable: true })
  referenceType?: QrBillReferenceType;
}
