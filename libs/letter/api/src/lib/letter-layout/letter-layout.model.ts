import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description:
    'Stationery for printed letters: a header and a footer repeated on every page of the pdf.',
})
export class LetterLayoutModel {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field()
  headerHtml!: string;

  @Field()
  footerHtml!: string;

  @Field(() => Int, {
    description: 'Height of the header band in millimetres from the top edge.',
  })
  headerHeightMm!: number;

  @Field(() => Int, {
    description:
      'Height of the footer band in millimetres from the bottom edge.',
  })
  footerHeightMm!: number;

  @Field({
    description: 'Templates without stationery of their own print on this one.',
  })
  isDefault!: boolean;
}

@InputType()
export class LetterLayoutPreviewInput {
  @Field()
  headerHtml!: string;

  @Field()
  footerHtml!: string;

  @Field(() => Int)
  headerHeightMm!: number;

  @Field(() => Int)
  footerHeightMm!: number;
}

@InputType()
export class LetterLayoutInput extends LetterLayoutPreviewInput {
  @Field()
  name!: string;

  @Field()
  isDefault!: boolean;
}

@ObjectType()
export class LetterLayoutPreviewModel {
  @Field({ description: 'A sample letter on this stationery, as base64 pdf.' })
  pdf!: string;
}
