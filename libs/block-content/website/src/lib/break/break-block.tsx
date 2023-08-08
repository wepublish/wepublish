import {css, styled} from '@mui/material'
import {BuilderBreakBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, LinkPageBreakBlock as LinkPageBreakBlockType} from '@wepublish/website/api'

export const isBreakBlock = (block: Block): block is LinkPageBreakBlockType =>
  block.__typename === 'LinkPageBreakBlock'

export const BreakBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  justify-content: center;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 2fr;
  }
`

export const BreakBlockSegment = styled('div')<{reverse?: boolean}>`
  display: grid;
  align-items: center;
  gap: ${({theme}) => theme.spacing(2)};

  ${({theme, reverse}) =>
    reverse &&
    css`
      ${theme.breakpoints.up('md')} {
        order: 1;
      }
    `}
`

export const BreakBlock = ({
  className,
  text,
  image,
  richText,
  layoutOption
}: BuilderBreakBlockProps) => {
  const {
    elements: {H4, Image},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const reverse = layoutOption === 'image-right'

  return (
    <BreakBlockWrapper className={className}>
      <BreakBlockSegment reverse={reverse}>{image && <Image image={image} />}</BreakBlockSegment>

      <BreakBlockSegment>
        <H4 component="div" role="heading">
          {text}
        </H4>

        <RichText richText={richText} />
      </BreakBlockSegment>
    </BreakBlockWrapper>
  )
}
