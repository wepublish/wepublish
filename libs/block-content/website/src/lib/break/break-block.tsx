import {css, styled, useMediaQuery, useTheme} from '@mui/material'
import {BuilderBreakBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, LinkPageBreakBlock as LinkPageBreakBlockType} from '@wepublish/website/api'

export const isBreakBlock = (block: Block): block is LinkPageBreakBlockType =>
  block.__typename === 'LinkPageBreakBlock'

export const BreakBlockWrapper = styled('div')<{reverse?: boolean}>`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  justify-content: center;
  align-items: center;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
    gap: ${({theme}) => theme.spacing(5)};
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

  const theme = useTheme()
  const squareImage = useMediaQuery(theme.breakpoints.up('md'))
  const reverse = layoutOption === 'image-right'

  return (
    <BreakBlockWrapper className={className} reverse={reverse}>
      <BreakBlockSegment reverse={reverse}>
        {image && <Image image={image} square={squareImage} />}
      </BreakBlockSegment>

      <BreakBlockSegment>
        <H4 component="div" role="heading">
          {text}
        </H4>

        <RichText richText={richText} />
      </BreakBlockSegment>
    </BreakBlockWrapper>
  )
}
