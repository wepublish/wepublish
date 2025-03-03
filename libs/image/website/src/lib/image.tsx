import {styled} from '@mui/material'
import {FullImageFragment} from '@wepublish/website/api'
import {BuilderImageProps, BuilderImageWidths} from '@wepublish/website/builder'
import {useImageProps} from './image.context'
import {useMemo} from 'react'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto'
  }
}

type ImageItem<Size extends BuilderImageWidths> = {size: Size; url: string | null | undefined}
type ImageItems = [
  xl: ImageItem<1200>,
  l: ImageItem<1000>,
  m: ImageItem<800>,
  s: ImageItem<500>,
  xs: ImageItem<300>,
  xxs: ImageItem<200>
]

export const imageToImageItems = (image: FullImageFragment): ImageItems => [
  {url: image.xl, size: 1200},
  {url: image.l, size: 1000},
  {url: image.m, size: 800},
  {url: image.s, size: 500},
  {url: image.xs, size: 300},
  {url: image.xxs, size: 200}
]

export const imageToSquareImageItems = (image: FullImageFragment): ImageItems => [
  {url: image.xlSquare, size: 1200},
  {url: image.lSquare, size: 1000},
  {url: image.mSquare, size: 800},
  {url: image.sSquare, size: 500},
  {url: image.xsSquare, size: 300},
  {url: image.xxsSquare, size: 200}
]

export const ImageWrapper = styled('img')<{aspectRatio: number; objectPosition: string}>`
  max-width: 100%;
  height: auto;
  aspect-ratio: auto ${({aspectRatio}) => aspectRatio};
  object-position: ${({objectPosition}) => objectPosition};
  // Sets a max height for images so that they will not be too tall
  // and makes them not distorted
  max-height: 80lvh;
  object-fit: contain;
`

export function Image({image, ...props}: BuilderImageProps) {
  const {maxWidth, square, fetchPriority, loading} = useImageProps(props)

  const images = useMemo(
    () => (square ? imageToSquareImageItems(image) : imageToImageItems(image)),
    [image, square]
  )

  const objectPosition = useMemo(
    () =>
      square
        ? 'center center'
        : `${(image.focalPoint?.x ?? 0.5) * 100}% ${(image.focalPoint?.y ?? 0.5) * 100}%`,
    [image.focalPoint?.x, image.focalPoint?.y, square]
  )

  const imageArray = useMemo(
    () =>
      images.reduce((array, img) => {
        if (maxWidth && img.size > maxWidth) {
          return array
        }

        if (img.url) {
          array.push(`${img.url} ${img.size}w`)
        }

        return array
      }, [] as string[]),
    [images, maxWidth]
  )

  const imageSizes = useMemo(
    () =>
      [...images].reverse().reduce((array, img, index) => {
        if (index === images.length - 1) {
          array.push(`${img.size}w`)
        } else {
          array.push(`(max-width: ${img.size * 2}px) ${img.size}w`)
        }

        return array
      }, [] as string[]),
    [images]
  )

  return (
    <ImageWrapper
      {...props}
      alt={image.description ?? image.title ?? image.filename ?? ''}
      title={image.title ?? ''}
      aspectRatio={image.width / image.height}
      objectPosition={objectPosition}
      srcSet={imageArray.join(',\n')}
      sizes={imageSizes.join(',\n')}
      loading={loading}
      fetchPriority={fetchPriority}
      width={square ? undefined : image.width}
      height={square ? undefined : image.height}
    />
  )
}
