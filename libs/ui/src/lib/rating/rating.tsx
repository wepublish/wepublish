import styled from '@emotion/styled';
import {
  Rating as MuiRating,
  RatingProps as MuiRatingProps,
} from '@mui/material';
import { SyntheticEvent, useEffect, useState } from 'react';
import { useHover } from 'react-aria';
import { MdStar, MdStarBorder } from 'react-icons/md';

export type RatingProps = Omit<MuiRatingProps, 'value' | 'onChange'> & {
  averageFilledColor?: string;
  averageEmptyColor?: string;
  userFilledColor?: string;
  userEmptyColor?: string;
  averageRating?: number;
  userRating?: number;
  onChange?: (event: SyntheticEvent<Element, Event>, newValue: number) => void;
};

export const RatingWrapper = styled('div')<Partial<RatingProps>>`
  position: relative;
  display: inline-flex;

  .average-rating {
    & .MuiRating-iconFilled {
      color: ${({ theme, averageFilledColor }) =>
        averageFilledColor || theme.palette.primary.main};
    }

    & .MuiRating-iconEmpty {
      color: ${({ theme, averageEmptyColor }) =>
        averageEmptyColor || theme.palette.grey[400]};
    }
  }

  .user-rating {
    position: absolute;
    top: 0;
    left: 0;

    & .MuiRating-iconFilled {
      color: ${({ theme, userFilledColor }) =>
        userFilledColor || theme.palette.primary.main};
    }

    & .MuiRating-iconHover {
      color: ${({ theme, userFilledColor }) =>
        userFilledColor || theme.palette.primary.main};
    }
  }
`;

export function Rating({
  averageFilledColor,
  averageEmptyColor,
  userFilledColor,
  userEmptyColor,
  averageRating,
  userRating,
  onChange,
  ...props
}: RatingProps) {
  const [internalRating, setInternalRating] = useState(userRating || 0);
  const { hoverProps, isHovered } = useHover({});

  useEffect(() => {
    setInternalRating(userRating || 0);
  }, [userRating]);

  const handleRatingChange = (
    event: SyntheticEvent<Element, Event>,
    newValue: number | null
  ) => {
    if (newValue !== null) {
      setInternalRating(newValue);
      onChange?.(event, newValue);
    }
  };

  const displayRating = internalRating ?? 0;

  const icon = props.icon ?? <MdStar />;
  const emptyIcon = props.emptyIcon ?? <MdStarBorder />;

  const showUserRating = (displayRating > 0 || isHovered) && !props.readOnly;

  return (
    <RatingWrapper
      {...(hoverProps as object)}
      userEmptyColor={userEmptyColor}
      userFilledColor={userFilledColor}
      averageEmptyColor={averageEmptyColor}
      averageFilledColor={averageFilledColor}
    >
      {!showUserRating && (
        <MuiRating
          className="average-rating"
          value={averageRating}
          icon={emptyIcon}
          emptyIcon={emptyIcon}
          readOnly
        />
      )}
      {showUserRating && (
        <MuiRating
          className="user-rating"
          value={displayRating}
          onChange={handleRatingChange}
          icon={icon}
          emptyIcon={emptyIcon}
        />
      )}
    </RatingWrapper>
  );
}
