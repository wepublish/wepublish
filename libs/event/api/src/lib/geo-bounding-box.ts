import { BadRequestException } from '@nestjs/common';
import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class GeoPointInput {
  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;
}

@InputType()
export class GeoBoundingBox {
  @Field(() => GeoPointInput)
  southWest!: GeoPointInput;

  @Field(() => GeoPointInput)
  northEast!: GeoPointInput;
}

export const geoBoundingBoxWhere = (box: GeoBoundingBox | null | undefined) => {
  if (!box) {
    return {};
  }

  const { southWest, northEast } = box;

  if (!southWest || !northEast) {
    throw new BadRequestException(
      'A bounding box needs both southWest and northEast.'
    );
  }

  if (
    southWest.latitude > northEast.latitude ||
    southWest.longitude > northEast.longitude
  ) {
    throw new BadRequestException(
      'The southWest corner must lie south-west of the northEast corner.'
    );
  }

  return {
    latitude: { gte: southWest.latitude, lte: northEast.latitude },
    longitude: { gte: southWest.longitude, lte: northEast.longitude },
  };
};
