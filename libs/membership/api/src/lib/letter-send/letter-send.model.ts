import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { LetterLogState, LetterLogType } from '@prisma/client';

registerEnumType(LetterLogState, {
  name: 'LetterLogState',
  description: 'Delivery state of a letter as the provider reports it.',
});

registerEnumType(LetterLogType, {
  name: 'LetterLogType',
});

@ObjectType()
export class LetterLogModel {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  recipientID!: string;

  @Field()
  letterTemplateId!: string;

  @Field({ nullable: true })
  invoiceId?: string;

  @Field(() => LetterLogState)
  state!: LetterLogState;

  @Field(() => LetterLogType)
  type!: LetterLogType;

  @Field({ nullable: true })
  providerLetterID?: string;

  @Field({ nullable: true })
  sentDate?: Date;

  @Field(() => Int, { nullable: true })
  pageCount?: number;

  @Field({ nullable: true })
  priceCurrency?: string;

  @Field({ nullable: true })
  trackingNumber?: string;

  @Field({ nullable: true })
  error?: string;
}
