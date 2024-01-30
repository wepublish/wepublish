import {styled, css, Theme, useTheme} from '@mui/material'
import {BuilderQuoteBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, QuoteBlock as QuoteBlockType} from '@wepublish/website/api'

export const isQuoteBlock = (block: Block): block is QuoteBlockType =>
  block.__typename === 'QuoteBlock'

const imageStyles = (theme: Theme) => css`
  ${theme.breakpoints.down('md')} {
    aspect-ratio: 1;
  }
`

export const QuoteBlockWrapper = styled('blockquote')<{withImage: boolean}>`
  font-style: italic;
  margin: ${({theme}) => theme.spacing(3)} ${({theme}) => theme.spacing(5)};
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};

  ${({theme, withImage}) =>
    withImage &&
    css`
      ${theme.breakpoints.up('md')} {
        grid-template-columns: 1fr 2fr;
      }
    `}
`

export const QuoteContent = styled('div')`
  display: grid;
  align-items: center;
`

export const QuoteBlock = ({quote, author, image, className}: BuilderQuoteBlockProps) => {
  const {
    elements: {H4, Image, Paragraph}
  } = useWebsiteBuilder()

  const theme = useTheme()

  return (
    <QuoteBlockWrapper className={className} withImage={!!image}>
      {image && <Image image={image} css={imageStyles(theme)} />}
      <QuoteContent>
        <H4 component="p" css={{alignSelf: 'end'}}>
          «{quote}»
        </H4>

        <Paragraph component="cite" css={{alignSelf: 'start'}}>
          {author}
        </Paragraph>
      </QuoteContent>
    </QuoteBlockWrapper>
  )
}
