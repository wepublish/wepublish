import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

export enum ImageRotation {
  Auto = 'auto',
  Rotate0 = '0',
  Rotate90 = '90',
  Rotate180 = '180',
  Rotate270 = '270',
}

registerEnumType(ImageRotation, {
  name: 'ImageRotation',
});

export enum ImageOutputFormat {
  Webp = 'webp',
  Jpeg = 'jpeg',
  Png = 'png',
}

registerEnumType(ImageOutputFormat, {
  name: 'ImageOutputFormat',
  description:
    'Encoding of a transformed image. Defaults to WebP; JPEG is for consumers without a WebP decoder, e.g. Outlook.',
});

@InputType()
export class ImageTransformation {
  @Field(() => Int, { nullable: true })
  width?: string;

  @Field(() => Int, { nullable: true })
  height?: string;

  @Field(() => ImageRotation, { nullable: true })
  rotation?: ImageRotation;

  @Field(() => Boolean, { nullable: true })
  blur?: boolean | number | null;

  @Field(() => Boolean, { nullable: true })
  negate?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  grayscale?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  sharpen?: boolean | null;

  @Field(() => ImageOutputFormat, { nullable: true })
  format?: ImageOutputFormat | null;
}
