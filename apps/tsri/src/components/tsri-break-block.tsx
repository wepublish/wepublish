import styled from '@emotion/styled';
import { css, Theme, Typography, useTheme } from '@mui/material';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const BreakBlockWrapper = styled('div')`
  display: grid;
  grid-template-rows: min-content auto;
  grid-template-columns: repeat(2, auto);
  background: linear-gradient(
    to bottom,
    #f5ff64,
    color-mix(in srgb, white 40%, #f5ff64)
  );
  border-radius: 1cqw;
  width: 83cqw;
  margin: 0 auto;
  row-gap: 5cqw;
  column-gap: 1.5cqw;
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
  align-items: center;
`;

export const BreakBlockImage = styled(Image)`
  object-fit: cover;
  width: 44.65cqw;
  margin: 0 auto;
  aspect-ratio: 1;
  border-radius: 0.8cqw;
`;

export const BreakBlockButton = styled(Button)`
  width: fit-content;
`;

const richTextStyles = (theme: Theme) => css`
  p {
    ${theme.typography.blockBreakBody}
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
          {!image && text && (
            <Typography variant="blockBreakTitle">{text}</Typography>
          )}

          {image && <BreakBlockImage image={image} />}
        </BreakBlockSegment>
      )}

      <BreakBlockSegment css={secondSegmentStyles}>
        {image && text && (
          <Typography
            variant="blockBreakTitle"
            component={'div'}
          >
            {text}
          </Typography>
        )}
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

export const TsriBreakBlock = styled(BreakBlock)`
  .MuiButton-root,
  .MuiButton-root:hover {
    background-color: ${({ theme }) => theme.palette.secondary.main};
    color: ${({ theme }) => theme.palette.secondary.contrastText};
  }

  ${BreakBlockHeading} {
    font-size: 2rem;
  }
`;
