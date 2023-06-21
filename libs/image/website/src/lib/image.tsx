import {styled} from '@mui/material'
import {FullImageFragment} from '@wepublish/website/api'
import {BuilderImageProps} from '@wepublish/website/builder'

declare module 'react' {
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

type ImageItem = {size: number; url: string | null | undefined}

const imageToImageItems = (image: FullImageFragment): ImageItem[] => [
  {url: image.bigURL, size: 800},
  {url: image.largeURL, size: 500},
  {url: image.mediumURL, size: 300},
  {url: image.smallURL, size: 200}
]

const imageToSquareImageItems = (image: FullImageFragment): ImageItem[] => [
  {url: image.squareBigURL, size: 800},
  {url: image.squareLargeURL, size: 500},
  {url: image.squareMediumURL, size: 300},
  {url: image.squareSmallURL, size: 200}
]

const ImageWrapper = styled('img')`
  max-width: 100%;
  height: auto;
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
      width={image.width}
      height={image.height}
      srcSet={imageArray.join(',\n')}
    />
  )
}
