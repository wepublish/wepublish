import {styled} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website-builder'
import {Block, QuoteBlock as QuoteBlockType} from '@wepublish/website/api'

export const isQuoteBlock = (block: Block): block is QuoteBlockType =>
  block.__typename === 'QuoteBlock'

export const QuoteBlockWrapper = styled('blockquote')`
  font-style: italic;
  margin: ${({theme}) => theme.spacing(3)};
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

export const QuoteBlock = ({quote, author, className}: QuoteBlockType & {className?: string}) => {
  const {
    ui: {H4, Paragraph}
  } = useWebsiteBuilder()

  return (
    <QuoteBlockWrapper className={className}>
      <H4 component="p">«{quote}»</H4>

      <Paragraph component="cite">{author}</Paragraph>
    </QuoteBlockWrapper>
  )
}
