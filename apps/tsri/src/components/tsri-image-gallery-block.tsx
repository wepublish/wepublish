import styled from '@emotion/styled';
import { ImageListItem, Typography } from '@mui/material';
import {
  ImageBlockCaption,
  ImageBlockSource,
  ImageGalleryBlockImageList,
  ImageGalleryBlockWrapper,
} from '@wepublish/block-content/website';
import {
  BuilderImageGalleryBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Trans } from 'react-i18next';

export const ImageWrapper = styled('div')`
  --sizing-factor: 2.9;

  ${({ theme }) => theme.breakpoints.up('md')} {
    --sizing-factor: 1;
  }

  width: 100%;
  border-radius: calc(var(--sizing-factor) * 0.6cqw);
  overflow: hidden;
`;

export const BaseImageGalleryBlock = ({
  images,
  className,
  blockStyle,
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
            <ImageWrapper>
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion, jsx-a11y/alt-text */}
              <Image image={image.image!} />
            </ImageWrapper>

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

export const TsriImageGalleryBlock = styled(BaseImageGalleryBlock)`
  overflow: hidden;

  ${ImageGalleryBlockImageList} {
    margin: 0;
    grid-template-columns: repeat(1, 1fr);
    column-gap: 1.25cqw !important;
    row-gap: 3.5cqw !important;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(3, 1fr);
      column-gap: 1.25cqw !important;
      row-gap: 1.25cqw !important;
    }

    .MuiImageListItem-root {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: 300px auto;
      overflow: hidden;
      gap: ${({ theme }) => theme.spacing(0.5)};

      ${({ theme }) => theme.breakpoints.up('md')} {
        gap: ${({ theme }) => theme.spacing(1)};
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        grid-row: 1 / 2;
        grid-column: -1 / 1;
      }

      figcaption {
        grid-row: 2 / 3;
        grid-column: -1 / 1;
        font-size: 0.75rem;
        line-height: 1rem;
        font-weight: 700;
        color: ${({ theme }) => theme.palette.common.black};
      }
    }
  }
`;
