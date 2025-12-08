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
}
