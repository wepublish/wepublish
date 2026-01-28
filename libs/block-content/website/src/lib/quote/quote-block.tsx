import { css, Typography } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderQuoteBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  BlockContent,
  QuoteBlock as QuoteBlockType,
} from '@wepublish/website/api';
import { Image } from '@wepublish/image/website';

export const isQuoteBlock = (
  block: Pick<BlockContent, '__typename'>
): block is QuoteBlockType => block.__typename === 'QuoteBlock';

const imageStyles = css`
  max-width: 80px;
`;

export const QuoteBlockWrapper = styled('blockquote')<{ withImage: boolean }>`
  font-style: italic;
  display: grid;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(0)}`};
  border-top: 2px solid ${({ theme }) => theme.palette.common.black};
  border-bottom: 2px solid ${({ theme }) => theme.palette.common.black};
  margin: 0;
  margin-left: calc(100% / 6);

  ${({ theme, withImage }) =>
    withImage &&
    css`
      ${theme.breakpoints.up('sm')} {
        gap: ${theme.spacing(3)};
        grid-template-columns: auto auto;
      }
    `};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => `${theme.spacing(5)} ${theme.spacing(3)}`};
  }
`;

export const QuoteContent = styled('div')`
  display: grid;
  align-items: center;
  justify-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const QuoteBlock = ({
  quote,
  author,
  image,
  className,
}: BuilderQuoteBlockProps) => {
  const {
    elements: { Paragraph },
  } = useWebsiteBuilder();

  return (
    <QuoteBlockWrapper
      className={className}
      withImage={!!image}
    >
      {image && (
        <Image
          image={image}
          square
          css={imageStyles}
        />
      )}

      <QuoteContent>
        <Typography
          variant="blockQuote"
          component="p"
        >
          {quote}
        </Typography>

        {author && (
          <Paragraph
            component="cite"
            gutterBottom={false}
          >
            {author}
          </Paragraph>
        )}
      </QuoteContent>
    </QuoteBlockWrapper>
  );
};
