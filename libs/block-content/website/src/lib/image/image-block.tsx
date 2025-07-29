import {Link, Typography} from '@mui/material'
import styled from '@emotion/styled'
import {BuilderImageBlockProps, Image} from '@wepublish/website/builder'
import {BlockContent, ImageBlock as ImageBlockType} from '@wepublish/website/api'
import {useEffect, useRef, useState} from 'react'
import {getContainedImageSize} from './contained-image-size'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

export const isImageBlock = (block: Pick<BlockContent, '__typename'>): block is ImageBlockType =>
  block.__typename === 'ImageBlock'

export const ImageBlockWrapper = styled('figure')`
  margin: 0;
  display: grid;
  justify-items: center;
`

export const ImageBlockInnerWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-template-columns: auto;
`

export const ImageBlockImage = styled(Image)`
  justify-self: center;
`

export const ImageBlockCaption = styled('figcaption')`
  max-width: 100%;
`

export const ImageBlockSource = styled('span')``

export const ImageBlock = ({caption, linkUrl, image, className}: BuilderImageBlockProps) => {
  const [realImageWidth, setRealImageWidth] = useState<number>()
  const imageRef = useRef<HTMLImageElement>(null)
  const captionRef = useRef<HTMLElement>(null)
  const img = image && <ImageBlockImage ref={imageRef} image={image} fetchPriority="high" />

  useEffect(() => {
    const calcImageSize = () => {
      if (imageRef.current && captionRef.current) {
        captionRef.current.style = 'display: none;'
        const [newImageWidth] = getContainedImageSize(imageRef.current)

        if (realImageWidth !== newImageWidth) {
          setRealImageWidth(newImageWidth)
        }

        captionRef.current.style = ''
      }
    }

    calcImageSize()
    window.addEventListener('resize', calcImageSize)
    imageRef.current?.addEventListener('load', calcImageSize)

    return () => {
      window.removeEventListener('resize', calcImageSize)
      imageRef.current?.removeEventListener('load', calcImageSize)
    }
  }, [realImageWidth])

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
          <Typography
            ref={captionRef}
            variant="caption"
            component={ImageBlockCaption}
            sx={realImageWidth ? {width: `${realImageWidth}px`, justifySelf: 'center'} : undefined}>
            {caption}
            {image?.source ? <ImageBlockSource> (Bild: {image?.source})</ImageBlockSource> : null}
          </Typography>
        )}
      </ImageBlockInnerWrapper>
    </ImageBlockWrapper>
  )
}
