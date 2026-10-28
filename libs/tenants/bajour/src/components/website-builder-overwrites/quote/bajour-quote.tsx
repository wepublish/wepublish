import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  BuilderQuoteBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const BajourQuoteBlockWrapper = styled('blockquote')<{
  withImage: boolean;
}>`
  font-style: italic;
  position: relative;
  margin: 0;
  padding-left: calc((100% / 48));
  padding-right: calc((100% / 48));

  ${({ theme, withImage }) =>
    withImage &&
    css`
      ${theme.breakpoints.up('sm')} {
        flex-direction: row;
      }
    `};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    max-width: calc((100% / 48) * 2 + ${({ theme }) => theme.spacing(85)});
    margin-left: 0;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: 0;
    margin-left: ${({ theme }) => `-${theme.spacing(8)}`};
    max-width: calc((100% / 12) * 4 + ${({ theme }) => theme.spacing(60)});
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-left: 0;
    padding-right: 0;
    max-width: ${({ theme }) => theme.spacing(85)};
  }
`;

export const BajourQuoteContent = styled('div')`
  flex: 1;
  text-align: left;
  margin-top: ${({ theme }) => theme.spacing(2.5)};
`;

const QuoteImage = styled('div')`
  width: ${({ theme }) => theme.spacing(20)};
  height: ${({ theme }) => theme.spacing(20)};
  border-radius: 50%;
  float: left;
  shape-outside: circle();
  shape-margin: ${({ theme }) => theme.spacing(1)};
  margin: 0 20px 10px 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    margin: 0 20px 0 0;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: ${({ theme }) => theme.spacing(30)};
    height: ${({ theme }) => theme.spacing(30)};
  }
`;

const BajourQuoteQuote = styled('div')`
  font-size: 20px !important;
  font-weight: 300 !important;
  line-height: 1.25 !important;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 32px !important;
  }
`;

const BajourQuoteAuthor = styled('div')`
  font-size: 0.8rem !important;
  margin-top: ${({ theme }) => theme.spacing(1)} !important;
  font-weight: 300 !important;

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin-top: ${({ theme }) => theme.spacing(2)} !important;
    font-size: 1rem !important;
  }
`;

export const BajourQuoteBlock = ({
  quote,
  author,
  image,
  className,
}: BuilderQuoteBlockProps) => {
  const {
    elements: { Image, Paragraph },
  } = useWebsiteBuilder();

  return (
    <BajourQuoteBlockWrapper
      className={className}
      withImage={!!image}
    >
      {image && (
        <QuoteImage>
          <Image
            image={image}
            square
          />
        </QuoteImage>
      )}

      <BajourQuoteContent>
        <Paragraph
          component={BajourQuoteQuote}
          gutterBottom={false}
        >
          {quote}
        </Paragraph>

        {author && (
          <Paragraph
            component={BajourQuoteAuthor}
            gutterBottom={false}
          >
            {author}
          </Paragraph>
        )}
      </BajourQuoteContent>
    </BajourQuoteBlockWrapper>
  );
};
