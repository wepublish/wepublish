import {Theme, css, styled, useTheme} from '@mui/material'
import {Block, LinkPageBreakBlock as LinkPageBreakBlockType} from '@wepublish/website/api'
import {BuilderBreakBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const isBreakBlock = (block: Block): block is LinkPageBreakBlockType =>
  block.__typename === 'LinkPageBreakBlock'

export const BreakBlockWrapper = styled('div')<{reverse?: boolean}>`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  justify-content: center;
  align-items: center;
  padding: ${({theme}) => `${theme.spacing(6)} ${theme.spacing(3)}`};

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: ${({theme}) => theme.spacing(10)} 0;
    grid-template-columns: 1fr 1fr;
    gap: ${({theme}) => theme.spacing(10)};
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
  object-fit: cover;
  width: 100%;
  max-width: ${theme.spacing(60)};
  margin: 0 auto;

  ${theme.breakpoints.up('md')} {
    width: 80%;
  }
`

const headingStylesNoImage = (theme: Theme) => css`
  font-size: 40px;
  font-weight: 600;
  text-transform: uppercase;

  ${theme.breakpoints.up('md')} {
    font-style: italic;
    font-size: 84px;
  }
`

const headingStylesWithImage = (theme: Theme) => css`
  font-size: 40px;
  font-weight: 600;
  text-transform: uppercase;

  ${theme.breakpoints.up('md')} {
    font-style: italic;
    font-size: 45px;
  }
`

const buttonStyles = (theme: Theme) => css`
  text-transform: none;
  background-color: ${theme.palette.common.black};
  margin-top: ${theme.spacing(2)};
  width: fit-content;
  padding: ${theme.spacing(1)} ${theme.spacing(3)};
  border-radius: ${theme.spacing(4)};

  :hover {
    background-color: ${theme.palette.common.black};
  }
`

const richTextStyles = (theme: Theme) => css`
  max-width: ${theme.spacing(55)};

  p {
    font-size: 16px;
  }

  ${theme.breakpoints.up('md')} {
    p {
      font-size: 22px;
    }
  }
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
    elements: {H2, H4, Image, Button, Link},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const theme = useTheme()
  const reverse = layoutOption === 'image-right'

  return (
    <BreakBlockWrapper className={className} reverse={reverse}>
      <BreakBlockSegment reverse={reverse}>
        {!image && (
          <H2 component="div" role="heading" css={headingStylesNoImage(theme)}>
            {text}
          </H2>
        )}

        {image && <Image image={image} css={imageStyles(theme)} />}
      </BreakBlockSegment>

      <BreakBlockSegment>
        {image && (
          <H4 component="div" role="heading" css={headingStylesWithImage(theme)}>
            {text}
          </H4>
        )}

        <RichText richText={richText} css={richTextStyles(theme)} />

        {!hideButton && linkURL && linkText && (
          <Button
            variant="contained"
            LinkComponent={Link}
            href={linkURL ?? ''}
            target={linkTarget ?? '_blank'}
            css={buttonStyles(theme)}>
            {linkText}
          </Button>
        )}
      </BreakBlockSegment>
    </BreakBlockWrapper>
  )
}
