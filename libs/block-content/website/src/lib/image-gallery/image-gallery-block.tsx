import { ImageList, ImageListItem, Typography } from '@mui/material';
import styled from '@emotion/styled';
import {
  BlockContent,
  ImageGalleryBlock as ImageGalleryBlockType,
} from '@wepublish/website/api';
import {
  BuilderImageGalleryBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ImageBlockCaption, ImageBlockSource } from '../image/image-block';
import { Trans } from 'react-i18next';

export const isImageGalleryBlock = (
  block: Pick<BlockContent, '__typename'>
): block is ImageGalleryBlockType => block.__typename === 'ImageGalleryBlock';

export const ImageGalleryBlockWrapper = styled('figure')`
  margin: 0;
`;

export const ImageGalleryBlockImageList = styled(ImageList)`
  margin: 0;
  grid-template-columns: repeat(1, 1fr);

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const ImageGalleryBlock = ({
  images,
  className,
}: BuilderImageGalleryBlockProps) => {
  const {
    elements: { Image },
  } = useWebsiteBuilder();
  const nonEmptyImages = images.filter(image => image.image);

  return (
    <ImageGalleryBlockWrapper className={className}>
      <ImageGalleryBlockImageList
        cols={0}
        gap={8}
      >
        {nonEmptyImages.map((image, index) => (
          <ImageListItem key={index}>
            <Image image={image.image!} />

            <Typography
              variant="caption"
              component={ImageBlockCaption}
            >
              <Trans
                i18nKey="image.caption"
                values={{
                  caption: image.caption ?? image.image?.title,
                  source: image.image?.source || 'EMPTY',
                }}
                components={{
                  ImageSource: <ImageBlockSource />,
                }}
              />
            </Typography>
          </ImageListItem>
        ))}
      </ImageGalleryBlockImageList>
    </ImageGalleryBlockWrapper>
  );
};
