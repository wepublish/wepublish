import {styled, css} from '@mui/material'
import {BuilderQuoteBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, QuoteBlock as QuoteBlockType} from '@wepublish/website/api'

export const isQuoteBlock = (block: Block): block is QuoteBlockType =>
  block.__typename === 'QuoteBlock'

const imageStyles = css`
  max-width: 80px;
`

export const QuoteBlockWrapper = styled('blockquote')<{withImage: boolean}>`
  font-style: italic;
  display: grid;
  align-items: center;
  justify-content: center;
  gap: ${({theme}) => theme.spacing(2)};
  padding: ${({theme}) => `${theme.spacing(4)} ${theme.spacing(0)}`};
  border-top: 2px solid ${({theme}) => theme.palette.common.black};
  border-bottom: 2px solid ${({theme}) => theme.palette.common.black};
  margin: 0;

  ${({theme, withImage}) =>
    withImage &&
    css`
      ${theme.breakpoints.up('sm')} {
        gap: ${theme.spacing(3)};
        grid-template-columns: auto auto;
      }
    `};

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: ${({theme}) => `${theme.spacing(5)} ${theme.spacing(3)}`};
  }
`

export const QuoteContent = styled('div')`
  display: grid;
  align-items: center;
  justify-items: center;
  text-align: center;
  gap: ${({theme}) => theme.spacing(3)};
`

export const QuoteBlock = ({quote, author, image, className}: BuilderQuoteBlockProps) => {
  const {
    elements: {H4, Image, Paragraph}
  } = useWebsiteBuilder()

  return (
    <QuoteBlockWrapper className={className} withImage={!!image}>
      {image && <Image image={image} square css={imageStyles} />}

      <QuoteContent>
        <H4 component="p">{quote}</H4>

        {author && (
          <Paragraph component="cite" gutterBottom={false}>
            {author}
          </Paragraph>
        )}
      </QuoteContent>
    </QuoteBlockWrapper>
  )
}
