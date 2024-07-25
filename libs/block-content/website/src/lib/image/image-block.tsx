import {Link, css, styled} from '@mui/material'
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
  margin: 0;
  display: grid;
  justify-items: center;
`

export const ImageBlockInnerWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: auto;
`

const imageStyles = css`
  justify-self: center;
`

export const ImageBlockCaption = styled('figcaption')``

export const ImageBlock = ({caption, linkUrl, image, className}: BuilderImageBlockProps) => {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const img = image && <Image image={image} fetchPriority="high" css={imageStyles} />

  return (
    <ImageBlockWrapper className={className}>
      <ImageBlockInnerWrapper>
        {linkUrl ? (
          <Link href={linkUrl} target="_blank">
            {img}
          </Link>
        ) : (
          img
        )}

        {(caption || image?.source) && (
          <figcaption>
            {caption} {image?.source ? <>(Bild: {image?.source})</> : null}
          </figcaption>
        )}
      </ImageBlockInnerWrapper>
    </ImageBlockWrapper>
  )
}
