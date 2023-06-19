import {styled} from '@mui/material'
import {BuilderImageBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, ImageBlock as ImageBlockType} from '@wepublish/website/api'

declare module 'react' {
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

export const isImageBlock = (block: Block): block is ImageBlockType =>
  block.__typename === 'ImageBlock'

export const ImageBlockWrapper = styled('figure')`
  margin: 0;
  max-width: 100%;
`

export const ImageBlock = ({caption, image, className}: BuilderImageBlockProps) => {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  return (
    <ImageBlockWrapper className={className}>
      {image && <Image image={image} fetchPriority="high" />}

      {caption && <figcaption>{caption}</figcaption>}
    </ImageBlockWrapper>
  )
}
