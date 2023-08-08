import {css, styled} from '@mui/material'
import {BuilderBreakBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, LinkPageBreakBlock as LinkPageBreakBlockType} from '@wepublish/website/api'

export const isBreakBlock = (block: Block): block is LinkPageBreakBlockType =>
  block.__typename === 'LinkPageBreakBlock'

export const BreakBlockWrapper = styled('div')<{reverse?: boolean}>`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: 100%;
  justify-content: center;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-auto-flow: ${props => props.reverse && 'column'};
    gap: ${({theme}) => theme.spacing(20)};
    grid-template-columns: repeat(2, 1fr);
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    gap: ${({theme}) => theme.spacing(30)};
  }
`

export const BreakBlockSegment = styled('div')<{reverse?: boolean}>`
  display: grid;
  width: 100%;
  align-items: center;
  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column-end: ${props => props.reverse && '-1'};
  }
`

const headingStyles = css`
  margin-bottom: 24px;
`

export const BreakBlock = ({
  className,
  layoutOption,
  text,
  image,
  richText
}: BuilderBreakBlockProps) => {
  const {
    elements: {H4, Image},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const reverse = layoutOption === 'image-right'

  return (
    <BreakBlockWrapper className={className} reverse={reverse}>
      <BreakBlockSegment reverse={reverse}>
        {image && <Image image={image} square />}
      </BreakBlockSegment>
      <BreakBlockSegment>
        <H4 css={headingStyles}>{text}</H4>
        <RichText richText={richText} />
      </BreakBlockSegment>
    </BreakBlockWrapper>
  )
}
