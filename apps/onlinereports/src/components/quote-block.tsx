import {BuilderQuoteBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {styled, Typography} from '@mui/material'

const QuoteBlockWrapper = styled(`div`)`
  display: flex;
  flex-direction: column;
  row-gap: ${({theme}) => theme.spacing(3)};
`
const QuoteContent = styled(`div`)`
  display: flex;
  flex-direction: column;
  row-gap: ${({theme}) => theme.spacing(1)};
  padding: 0 ${({theme}) => theme.spacing(3)};
`
const Quote = styled(Typography)`
  font-size: 28px;
  font-weight: 600;
`
const ImageWrapper = styled('div')`
  aspect-ratio: 4/3;
  width: 50%;
  margin: 0 auto;

  img {
    aspect-ratio: 4/3;
  }
`

export const OnlineReportsQuoteBlock = ({
  quote,
  author,
  image,
  className
}: BuilderQuoteBlockProps) => {
  const {
    elements: {H4, Image, Paragraph}
  } = useWebsiteBuilder()

  return (
    <QuoteBlockWrapper className={className}>
      <QuoteContent>
        <Quote variant={'subtitle2'}>{quote}</Quote>
        {author && (
          <Paragraph component="cite" gutterBottom={false}>
            {author}
          </Paragraph>
        )}
      </QuoteContent>

      <ImageWrapper>{image && <Image image={image} />}</ImageWrapper>
    </QuoteBlockWrapper>
  )
}
