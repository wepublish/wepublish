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
  --sizing-factor: 2.7;
  display: grid;
  background: linear-gradient(
    to bottom,
    ${({ theme }) => theme.palette.primary.light},
    color-mix(
      in srgb,
      ${({ theme }) => theme.palette.common.white} 40%,
      ${({ theme }) => theme.palette.primary.light}
    )
  );
  border-radius: 2cqw;
  margin: 0 auto;
  row-gap: 5cqw;
  column-gap: 0;
  grid-template-rows: unset;
  grid-template-columns: unset;

  ${({ theme }) => theme.breakpoints.up('md')} {
    --sizing-factor: 1;
    grid-template-rows: min-content auto;
    grid-template-columns: 57% calc(100% - 57%);
    width: 69.4%;
    border-radius: 1cqw;
  }
`;

export const BreakBlockHeading = styled('div')`
  grid-column: 1 / -1;
  grid-row: 1 / 2;
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  font-size: calc(var(--sizing-factor) * 1.2cqw) !important;
  line-height: calc(var(--sizing-factor) * 1.2cqw) !important;
  text-align: left;
  font-weight: 700 !important;
  padding: calc(var(--sizing-factor) * 0.75cqw)
    calc(var(--sizing-factor) * 1cqw) !important;
  border-top-left-radius: 2cqw;
  border-top-right-radius: 2cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    border-top-left-radius: 1cqw;
    border-top-right-radius: 1cqw;
  }
`;

export const BreakBlockSegment = styled('div')`
  display: grid;
  align-items: start;
`;

export const BreakBlockImage = styled(Image)`
  object-fit: cover;
  margin: 0 auto;
  aspect-ratio: 1;
  border-radius: 0.8cqw;
  max-height: unset;
`;

export const BreakBlockButton = styled(Button)`
  width: fit-content;
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  justify-self: end;
  padding-right: calc(var(--sizing-factor) * 8cqw);
  margin-top: calc(var(--sizing-factor) * 4cqw);
  transition: all 0s;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.main} !important;
    color: ${({ theme }) => theme.palette.common.white} !important;
  }
`;

const richTextStyles = (theme: Theme) => css`
  h2 {
    font-size: calc(var(--sizing-factor) * 2.42cqw) !important;
    line-height: calc(var(--sizing-factor) * 2.6cqw) !important;
    font-weight: 700 !important;
    color: ${theme.palette.common.black};
    margin-bottom: calc(var(--sizing-factor) * 1cqw);
    padding: 0;
  }

  p {
    font-size: calc(var(--sizing-factor) * 1.48cqw) !important;
    line-height: calc(var(--sizing-factor) * 2.04cqw) !important;
    font-weight: 700 !important;
    color: ${theme.palette.common.black};
  }
`;

const firstSegmentStyles = (theme: Theme) => css`
  padding: 0 calc(var(--sizing-factor) * 1cqw) calc(var(--sizing-factor) * 1cqw)
    calc(var(--sizing-factor) * 1cqw);

  ${theme.breakpoints.up('md')} {
    padding-right: 0;
    grid-column: 1 / 2;
    grid-row: 2 / 3;
  }
`;

const secondSegmentStyles = (theme: Theme) => css`
  padding: 0 calc(var(--sizing-factor) * 1cqw) calc(var(--sizing-factor) * 1cqw)
    0;
  margin-left: calc(var(--sizing-factor) * 1.5cqw);

  ${theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    grid-template-rows: auto min-content;
  }
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
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
  }

  ${BreakBlockHeading} {
    font-size: 2rem;
  }
`;
