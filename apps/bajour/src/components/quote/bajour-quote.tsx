import {css, styled} from '@mui/material'
import {BuilderQuoteBlockProps, useWebsiteBuilder} from '@wepublish/website'

export const BajourQuoteBlockWrapper = styled('blockquote')<{withImage: boolean}>`
  font-style: italic;
  position: relative;
  margin: 0;
  padding-left: calc((100% / 48));
  padding-right: calc((100% / 48));

  ${({theme, withImage}) =>
    withImage &&
    css`
      ${theme.breakpoints.up('sm')} {
        flex-direction: row;
      }
    `};

  ${({theme}) => theme.breakpoints.up('sm')} {
    max-width: calc((100% / 48) * 2 + ${({theme}) => theme.spacing(85)});
    margin-left: 0;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    margin: 0;
    margin-left: ${({theme}) => `-${theme.spacing(8)}`};
    max-width: calc((100% / 12) * 4 + ${({theme}) => theme.spacing(60)});
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    padding-left: 0;
    padding-right: 0;
    max-width: ${({theme}) => theme.spacing(85)};
  }
`

export const BajourQuoteContent = styled('div')`
  flex: 1;
  text-align: left;
  margin-top: ${({theme}) => theme.spacing(2.5)};
`

const QuoteImage = styled('div')`
  width: ${({theme}) => theme.spacing(20)};
  height: ${({theme}) => theme.spacing(20)};
  border-radius: 50%;
  float: left;
  shape-outside: circle();
  shape-margin: ${({theme}) => theme.spacing(1)};
  margin: 0 20px 10px 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${({theme}) => theme.breakpoints.up('sm')} {
    margin: 0 20px 0 0;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    width: ${({theme}) => theme.spacing(30)};
    height: ${({theme}) => theme.spacing(30)};
  }
`

const BajourQuoteQuote = styled('p')`
  font-size: 20px;
  font-weight: 300;
  line-height: 1.25;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 32px;
  }
`

const BajourQuoteAuthor = styled('cite')`
  display: inline-block;
  font-size: 0.8rem;
  margin-top: ${({theme}) => theme.spacing(1)};
  font-weight: 300;

  ${({theme}) => theme.breakpoints.up('md')} {
    margin-top: ${({theme}) => theme.spacing(2)};
    font-size: 1rem;
  }
`

export const BajourQuoteBlock = ({quote, author, image, className}: BuilderQuoteBlockProps) => {
  const {
    elements: {H4, Image, Paragraph}
  } = useWebsiteBuilder()

  return (
    <BajourQuoteBlockWrapper className={className} withImage={!!image}>
      {image && (
        <QuoteImage>
          <Image image={image} square />
        </QuoteImage>
      )}
      <BajourQuoteContent>
        <H4 component={BajourQuoteQuote}>{quote}</H4>
        {author && (
          <Paragraph component={BajourQuoteAuthor} gutterBottom={false}>
            {author}
          </Paragraph>
        )}
      </BajourQuoteContent>
    </BajourQuoteBlockWrapper>
  )
}
