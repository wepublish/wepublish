import {styled} from '@mui/material'
import {BuilderImageBlockProps} from '@wepublish/website/builder'
import {Block, ImageBlock as ImageBlockType} from '@wepublish/website/api'

export const isImageBlock = (block: Block): block is ImageBlockType =>
  block.__typename === 'ImageBlock'

export const ImageBlockWrapper = styled('figure')`
  margin: 0;
  max-width: 100%;
`

export const ImageBlock = ({caption, image, className}: BuilderImageBlockProps) => (
  <ImageBlockWrapper className={className}>
    {image?.url && <img width={image.width} height={image.height} src={image.url} />}

    <figcaption>{caption}</figcaption>
  </ImageBlockWrapper>
)
