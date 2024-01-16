import {styled} from '@mui/material'
import {FullImageFragment} from '@wepublish/website/api'
import {BuilderImageProps} from '@wepublish/website/builder'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

type ImageItem = {size: number; url: string | null | undefined}

export const imageToImageItems = (image: FullImageFragment): ImageItem[] => [
  {url: image.bigURL, size: 800},
  {url: image.largeURL, size: 500},
  {url: image.mediumURL, size: 300},
  {url: image.smallURL, size: 200}
]

export const imageToSquareImageItems = (image: FullImageFragment): ImageItem[] => [
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

export function Image({
  image,
  square,
  loading = 'lazy',
  fetchPriority = 'low',
  ...props
}: BuilderImageProps) {
  const images = square ? imageToSquareImageItems(image) : imageToImageItems(image)

  const imageArray = images.reduce((array, img) => {
    if (img.url) {
      array.push(`${img.url} ${img.size}w`)
    }

    return array
  }, [] as string[])

  return (
    <ImageWrapper
      {...props}
      alt={image.description ?? image.title ?? image.filename ?? ''}
      title={image.title ?? ''}
      aspectRatio={image.width / image.height}
      srcSet={imageArray.join(',\n')}
      loading={loading}
      fetchPriority={fetchPriority}
    />
  )
}
