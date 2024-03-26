import {css, styled} from '@mui/material'
import {BuilderImageBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, ImageBlock as ImageBlockType} from '@wepublish/website/api'

export const isImageBlock = (block: Block): block is ImageBlockType =>
  block.__typename === 'ImageBlock'

export const ImageBlockWrapper = styled('figure')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  margin: 0;
  max-width: 100%;
`

export const ImageBlockCaption = styled('figcaption')``

const imageStyles = css`
  object-fit: cover;
  aspect-ratio: 1.85611511;
`

export const ImageBlock = ({caption, image, className}: BuilderImageBlockProps) => {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  return (
    <ImageBlockWrapper className={className}>
      {image && <Image image={image} css={imageStyles} fetchPriority="high" />}

      {caption && <figcaption>{caption}</figcaption>}
    </ImageBlockWrapper>
  )
}
