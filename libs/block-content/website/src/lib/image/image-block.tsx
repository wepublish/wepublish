import {Link, styled} from '@mui/material'
import {BuilderImageBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, ImageBlock as ImageBlockType} from '@wepublish/website/api'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

export const isImageBlock = (block: Block): block is ImageBlockType =>
  block.__typename === 'ImageBlock'

export const ImageBlockWrapper = styled('figure')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  margin: 0;
  max-width: 100%;
`

export const ImageBlockCaption = styled('figcaption')``

export const ImageBlock = ({caption, linkUrl, image, className}: BuilderImageBlockProps) => {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  return (
    <ImageBlockWrapper className={className}>
      {image &&
        (linkUrl ? (
          <Link href={linkUrl} target="_blank">
            <Image image={image} fetchPriority="high" />
          </Link>
        ) : (
          <Image image={image} fetchPriority="high" />
        ))}

      {caption && <figcaption>{caption}</figcaption>}
    </ImageBlockWrapper>
  )
}
