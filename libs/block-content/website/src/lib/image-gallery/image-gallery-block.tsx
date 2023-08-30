import {
  styled,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {BuilderImageGalleryBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, ImageGalleryBlock as ImageGalleryBlockType} from '@wepublish/website/api'

export const isImageGalleryBlock = (block: Block): block is ImageGalleryBlockType =>
  block.__typename === 'ImageGalleryBlock'

export const ImageGalleryBlockWrapper = styled('figure')``

export const ImageGalleryBlock = ({images, className}: BuilderImageGalleryBlockProps) => {
  const {
    elements: {Image}
  } = useWebsiteBuilder()
  const theme = useTheme()
  const medium = useMediaQuery(theme.breakpoints.up('sm'), {
    noSsr: true
  })
  const big = useMediaQuery(theme.breakpoints.up('md'), {
    noSsr: true
  })
  const cols = big ? 3 : medium ? 2 : 1

  const nonEmptyImages = images.filter(image => image.image)

  return (
    <ImageGalleryBlockWrapper className={className}>
      <ImageList cols={cols} gap={8}>
        {nonEmptyImages.map((image, index) => (
          <ImageListItem key={index}>
            <Image image={image.image!} />

            <ImageListItemBar title={image.caption ?? image.image?.title} position="below" />
          </ImageListItem>
        ))}
      </ImageList>
    </ImageGalleryBlockWrapper>
  )
}
