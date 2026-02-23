import styled from '@emotion/styled';
import {
  Rating as MuiRating,
  RatingProps as MuiRatingProps,
} from '@mui/material';
import { SyntheticEvent, useEffect, useState } from 'react';
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

type RatingColors = {
  filledColor?: string;
  emptyColor?: string;
};

export const RatingContainer = styled('div')`
  display: inline-flex;
  cursor: pointer;
`;

export const AverageRatingWrapper = styled('div')<Partial<RatingColors>>`
  .MuiRating-iconFilled {
    color: ${({ theme, filledColor }) =>
      filledColor || theme.palette.primary.main};
  }

  .MuiRating-iconEmpty {
    color: ${({ theme, emptyColor }) => emptyColor || theme.palette.grey[400]};
  }
`;

export const UserRatingWrapper = styled('div')<Partial<RatingColors>>`
  .MuiRating-iconFilled {
    color: ${({ theme, filledColor }) =>
      filledColor || theme.palette.primary.main};
  }

  .MuiRating-iconEmpty {
    color: ${({ theme, emptyColor }) => emptyColor || theme.palette.grey[400]};
  }

  .MuiRating-iconHover {
    color: ${({ theme, filledColor }) =>
      filledColor || theme.palette.primary.main};
  }
`;

export function Rating({
  averageFilledColor,
  averageEmptyColor,
  userFilledColor,
  userEmptyColor,
  averageRating = 0,
  userRating = 0,
  onChange,
  ...props
}: RatingProps) {
  const [internalRating, setInternalRating] = useState(userRating);
  const [isRatingMode, setIsRatingMode] = useState(false);

  useEffect(() => {
    setInternalRating(userRating);
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

  const handleContainerClick = () => {
    if (!props.readOnly) {
      setIsRatingMode(true);
    }
  };

  const handleRatingComplete = (
    event: SyntheticEvent<Element, Event>,
    newValue: number | null
  ) => {
    handleRatingChange(event, newValue);
    setIsRatingMode(false);
  };

  const icon = props.icon ?? <MdStar />;
  const emptyIcon = props.emptyIcon ?? <MdStarBorder />;

  const displayValue =
    isRatingMode || internalRating > 0 ? internalRating : averageRating;
  const isReadOnly = props.readOnly || !isRatingMode;

  return (
    <RatingContainer onClick={handleContainerClick}>
      {!isRatingMode && !internalRating ?
        <AverageRatingWrapper
          filledColor={averageFilledColor}
          emptyColor={averageEmptyColor}
        >
          <MuiRating
            value={averageRating}
            icon={emptyIcon}
            emptyIcon={emptyIcon}
            readOnly
            {...props}
          />
        </AverageRatingWrapper>
      : <UserRatingWrapper
          filledColor={userFilledColor}
          emptyColor={userEmptyColor}
        >
          <MuiRating
            value={displayValue}
            onChange={isRatingMode ? handleRatingComplete : undefined}
            icon={icon}
            emptyIcon={emptyIcon}
            readOnly={isReadOnly}
            {...props}
          />
        </UserRatingWrapper>
      }
    </RatingContainer>
  );
}
