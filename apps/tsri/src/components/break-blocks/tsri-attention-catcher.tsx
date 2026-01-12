import styled from '@emotion/styled';
import { css, Theme, Typography, useTheme } from '@mui/material';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriBreakBlockType } from './tsri-base-break-block';

export const BreakBlockWrapper = styled('div')`
  display: grid;
  grid-template-rows: min-content auto;
  grid-template-columns: 57% calc(100% - 57%);
  background: linear-gradient(
    to bottom,
    #f5ff64,
    color-mix(in srgb, white 40%, #f5ff64)
  );
  border-radius: 1cqw;
  width: 69.4cqw;
  margin: 0 auto;
  row-gap: 5cqw;
  column-gap: 0;
`;

export const BreakBlockHeading = styled('div')`
  grid-column: 1 / -1;
  grid-row: 1 / 2;
  background-color: black;
  color: white;
  font-size: 1.2cqw !important;
  line-height: 1.2cqw !important;
  text-align: left;
  font-weight: 700 !important;
  padding: 0.75cqw 1cqw !important;
  border-top-left-radius: 1cqw;
  border-top-right-radius: 1cqw;
`;

export const BreakBlockSegment = styled('div')`
  display: grid;
  align-items: start;
`;

export const BreakBlockImage = styled(Image)`
  object-fit: cover;
  //width: 37.4cqw;
  margin: 0 auto;
  aspect-ratio: 1;
  border-radius: 0.8cqw;
  max-height: unset;
`;

export const BreakBlockButton = styled(Button)`
  width: fit-content;
  background-color: black;
  color: white;
  justify-self: end;
  padding-right: 8cqw;
  margin-top: 4cqw;
  transition: all 0s;

  &:hover {
    background-color: rgb(12, 159, 237) !important;
    color: white !important;
  }
`;

const richTextStyles = (theme: Theme) => css`
  h2 {
    font-size: 2.42cqw !important;
    line-height: 2.6cqw !important;
    font-weight: 700 !important;
    color: black;
    margin-bottom: 1cqw;
    padding: 0;
  }

  p {
    font-size: 1.48cqw !important;
    line-height: 2.04cqw !important;
    font-weight: 700 !important;
    color: black;
  }
`;

const firstSegmentStyles = css`
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  padding: 0 0 1cqw 1cqw;
`;

const secondSegmentStyles = css`
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  padding: 0 1cqw 1cqw 0;
  margin-left: 1.5cqw;
  grid-template-rows: auto min-content;
`;

export const BreakBlock = ({
  className,
  text,
  image,
  richText,
  hideButton,
  linkTarget,
  linkText,
  linkURL,
}: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const theme = useTheme();

  return (
    <BreakBlockWrapper className={className}>
      {text && <Typography component={BreakBlockHeading}>{text}</Typography>}
      {(image || text) && (
        <BreakBlockSegment css={firstSegmentStyles}>
          {image && <BreakBlockImage image={image} />}
        </BreakBlockSegment>
      )}

      <BreakBlockSegment css={secondSegmentStyles}>
        <RichText
          richText={richText}
          css={richTextStyles(theme)}
        />

        {!hideButton && linkURL && linkText && (
          <BreakBlockButton
            color="accent"
            variant="contained"
            size="medium"
            LinkComponent={Link}
            href={linkURL ?? ''}
            target={linkTarget ?? '_blank'}
          >
            {linkText}
          </BreakBlockButton>
        )}
      </BreakBlockSegment>
    </BreakBlockWrapper>
  );
};

export const isTsriAttentionCatcher = allPass([
  ({ blockStyle }: BuilderBreakBlockProps) => {
    return blockStyle === TsriBreakBlockType.AttentionCatcher;
  },
]);

export const TsriAttentionCatcher = styled(BreakBlock)`
  .MuiButton-root,
  .MuiButton-root:hover {
    background-color: ${({ theme }) => theme.palette.secondary.main};
    color: ${({ theme }) => theme.palette.secondary.contrastText};
  }

  ${BreakBlockHeading} {
    font-size: 2rem;
  }
`;
