import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { TrackingPixelProviderType } from '@prisma/client';

registerEnumType(TrackingPixelProviderType, {
  name: 'TrackingPixelProviderType',
});

@ObjectType()
export class TrackingPixelMethod {
  @Field()
  id!: string;

  @Field()
  trackingPixelProviderID!: string;

  @Field(() => TrackingPixelProviderType)
  trackingPixelProviderType!: TrackingPixelProviderType;
}

@ObjectType()
export class TrackingPixel {
  @Field()
  id!: string;

  @Field(() => TrackingPixelMethod)
  trackingPixelMethod!: TrackingPixelMethod;

  @Field({ nullable: true })
  pixelUid?: string;

  @Field({ nullable: true })
  uri?: string;

  @Field({ nullable: true })
  error?: string;
}
