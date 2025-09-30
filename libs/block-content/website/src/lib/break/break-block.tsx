import { Theme, Typography, css, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import {
  BlockContent,
  BreakBlock as BreakBlockType,
} from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const isBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType => block.__typename === 'BreakBlock';

export const BreakBlockWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing(6)} ${theme.spacing(3)}`};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(10)} 0;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing(10)};
  }
`;

export const BreakBlockSegment = styled('div')`
  display: grid;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const BreakBlockImage = styled(Image)`
  object-fit: cover;
  width: 100%;
  max-width: ${({ theme }) => theme.spacing(60)};
  margin: 0 auto;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 80%;
  }
`;

export const BreakBlockHeading = styled('div')``;

export const BreakBlockButton = styled(Button)`
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(3)};
  width: fit-content;
`;

const richTextStyles = (theme: Theme) => css`
  max-width: ${theme.spacing(55)};

  p {
    ${theme.typography.blockBreakBody}
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
      {(image || text) && (
        <BreakBlockSegment>
          {!image && text && (
            <Typography
              variant="blockBreakTitle"
              component={BreakBlockHeading}
            >
              {text}
            </Typography>
          )}

          {image && <BreakBlockImage image={image} />}
        </BreakBlockSegment>
      )}

      <BreakBlockSegment>
        {image && text && (
          <Typography
            variant="blockBreakTitle"
            component={BreakBlockHeading}
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
