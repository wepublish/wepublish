import { BadRequestException } from '@nestjs/common';

export const MAX_ZIP_LENGTH = 4;

export type LocationInput = {
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export const assertValidLocation = ({
  zip,
  latitude,
  longitude,
}: LocationInput) => {
  if (zip && zip.length > MAX_ZIP_LENGTH) {
    throw new BadRequestException(
      `Zip must not be longer than ${MAX_ZIP_LENGTH} characters.`
    );
  }

  if ((latitude == null) !== (longitude == null)) {
    throw new BadRequestException(
      'Latitude and longitude must be given together.'
    );
  }
};
