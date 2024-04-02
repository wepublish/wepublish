import {Theme, css, styled, useTheme} from '@mui/material'
import {Block, LinkPageBreakBlock as LinkPageBreakBlockType} from '@wepublish/website/api'
import {BuilderBreakBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

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

const imageStyles = (theme: Theme) => css`
  ${theme.breakpoints.down('md')} {
    aspect-ratio: 1;
  }
`

const buttonStyles = css`
  justify-self: start;
`

export const BreakBlock = ({
  className,
  text,
  image,
  richText,
  layoutOption,
  hideButton,
  linkTarget,
  linkText,
  linkURL,
  styleOption,
  templateOption
}: BuilderBreakBlockProps) => {
  const {
    elements: {H4, Image, Button, Link},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const theme = useTheme()
  const reverse = layoutOption === 'image-right'

  return (
    <BreakBlockWrapper className={className} reverse={reverse}>
      <BreakBlockSegment reverse={reverse}>
        {!image && (
          <H4 component="div" role="heading">
            {text}
          </H4>
        )}

        {image && <Image image={image} css={imageStyles(theme)} />}
      </BreakBlockSegment>

      <BreakBlockSegment>
        {image && (
          <H4 component="div" role="heading">
            {text}
          </H4>
        )}

        <RichText richText={richText} />

        {!hideButton && linkURL && (
          <Button
            variant="contained"
            color="primary"
            LinkComponent={Link}
            href={linkURL}
            css={buttonStyles}>
            {linkText}
          </Button>
        )}
      </BreakBlockSegment>
    </BreakBlockWrapper>
  )
}
