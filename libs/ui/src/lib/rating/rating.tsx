import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Rating as MuiRating, useTheme } from '@mui/material';
import { ComponentProps } from 'react';
import { useHover } from 'react-aria';
import { MdStar, MdStarBorder } from 'react-icons/md';

export type RatingProps = ComponentProps<typeof MuiRating> & {
  filledColor?: string;
  hoverColor?: string;
  emptyColor?: string;
  showFilledIcon?: boolean;
};

export const RatingWrapper = styled('div')<RatingProps>`
  ${({ filledColor, theme }) =>
    filledColor &&
    css`
      & .MuiRating-iconFilled {
        color: ${filledColor};
      }
    `}

  ${({ hoverColor }) =>
    hoverColor &&
    css`
      & .MuiRating-iconHover {
        color: ${hoverColor};
      }
    `}

    ${({ emptyColor }) =>
    emptyColor &&
    css`
      & .MuiRating-iconEmpty {
        color: ${emptyColor};
      }
    `}
`;

export function Rating({
  filledColor,
  hoverColor,
  emptyColor,
  showFilledIcon = true,
  ...props
}: RatingProps) {
  const { hoverProps, isHovered } = useHover({});
  const theme = useTheme();

  const icon = props.icon ?? <MdStar />;
  const emptyIcon = props.emptyIcon ?? <MdStarBorder />;

  return (
    <RatingWrapper
      {...(hoverProps as object)}
      emptyColor={emptyColor || theme.palette.grey[400]}
      filledColor={filledColor || theme.palette.primary.main}
      hoverColor={hoverColor || theme.palette.primary.main}
    >
      <MuiRating
        {...props}
        icon={
          (isHovered && !props.readOnly) || showFilledIcon ? icon : emptyIcon
        }
        emptyIcon={null}
      />
    </RatingWrapper>
  );
}
