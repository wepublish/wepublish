import {ImageList, ImageListItem, styled} from '@mui/material'
import {Block, ImageGalleryBlock as ImageGalleryBlockType} from '@wepublish/website/api'
import {BuilderImageGalleryBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const isImageGalleryBlock = (block: Block): block is ImageGalleryBlockType =>
  block.__typename === 'ImageGalleryBlock'

export const ImageGalleryBlockWrapper = styled('figure')`
  margin: 0;
`

export const ImageGalleryBlockImageList = styled(ImageList)`
  margin: 0;
  grid-template-columns: repeat(1, 1fr);

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(3, 1fr);
  }
`

export const ImageGalleryBlock = ({images, className}: BuilderImageGalleryBlockProps) => {
  const {
    elements: {Image, Paragraph}
  } = useWebsiteBuilder()
  const nonEmptyImages = images.filter(image => image.image)

  return (
    <ImageGalleryBlockWrapper className={className}>
      <ImageGalleryBlockImageList cols={0} gap={8}>
        {nonEmptyImages.map((image, index) => (
          <ImageListItem key={index}>
            <Image image={image.image!} />

            <Paragraph gutterBottom={false}>{image.caption ?? image.image?.title}</Paragraph>
          </ImageListItem>
        ))}
      </ImageGalleryBlockImageList>
    </ImageGalleryBlockWrapper>
  )
}
