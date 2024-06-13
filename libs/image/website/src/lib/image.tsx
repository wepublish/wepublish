import {styled} from '@mui/material'
import {FullImageFragment} from '@wepublish/website/api'
import {BuilderImageProps} from '@wepublish/website/builder'
import {useImageProps} from './image.context'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

type ImageItem<Size extends number> = {size: Size; url: string | null | undefined}
type ImageItems = [
  bigUrl: ImageItem<800>,
  largeUrl: ImageItem<500>,
  mediumUrl: ImageItem<300>,
  smallUrl: ImageItem<200>
]

export const imageToImageItems = (image: FullImageFragment): ImageItems => [
  {url: image.bigURL, size: 800},
  {url: image.largeURL, size: 500},
  {url: image.mediumURL, size: 300},
  {url: image.smallURL, size: 200}
]

export const imageToSquareImageItems = (image: FullImageFragment): ImageItems => [
  {url: image.squareBigURL, size: 800},
  {url: image.squareLargeURL, size: 500},
  {url: image.squareMediumURL, size: 300},
  {url: image.squareSmallURL, size: 200}
]

export const ImageWrapper = styled('img')<{aspectRatio: number}>`
  max-width: 100%;
  height: auto;
  aspect-ratio: auto ${({aspectRatio}) => aspectRatio};
  // Sets a max height for images so that they will not be too tall
  // and makes them not distorted
  max-height: 80lvh;
  object-fit: contain;
`

export function Image({image, ...props}: BuilderImageProps) {
  const {square, fetchPriority, loading} = useImageProps(props)
  const images = square ? imageToSquareImageItems(image) : imageToImageItems(image)

  const imageArray = images.reduce((array, img) => {
    if (img.url) {
      array.push(`${img.url} ${img.size}w`)
    }

    return array
  }, [] as string[])

  const imageSizes = [...images].reverse().reduce((array, img, index) => {
    if (index === images.length - 1) {
      array.push(`${img.size}w`)
    } else {
      array.push(`(max-width: ${img.size * 2}px) ${img.size}w`)
    }

    return array
  }, [] as string[])

  // @TODO: Remove with new media server
  // Hack for animated gifs to work
  if (image.format === 'gif' && image.url) {
    return (
      <ImageWrapper
        {...props}
        alt={image.description ?? image.title ?? image.filename ?? ''}
        title={image.title ?? ''}
        aspectRatio={image.width / image.height}
        src={image.url}
        loading={loading}
        fetchPriority={fetchPriority}
      />
    )
  }

  return (
    <ImageWrapper
      {...props}
      alt={image.description ?? image.title ?? image.filename ?? ''}
      title={image.title ?? ''}
      aspectRatio={image.width / image.height}
      srcSet={imageArray.join(',\n')}
      sizes={imageSizes.join(',\n')}
      loading={loading}
      fetchPriority={fetchPriority}
    />
  )
}
