import { RatingSystemType } from '@prisma/client';
import { InvalidStarRatingValueError } from '../../error';

export const validateCommentRatingValue = (
  type: RatingSystemType,
  value: number
) => {
  switch (type) {
    case RatingSystemType.star: {
      if (value <= 0 || value > 5) {
        throw new InvalidStarRatingValueError();
      }
    }
  }
};
