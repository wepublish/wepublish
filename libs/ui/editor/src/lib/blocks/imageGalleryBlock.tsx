import styled from '@emotion/styled';
import { Button, Drawer, IconButton, Typography } from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAddCircle,
  MdArrowLeft,
  MdArrowRight,
  MdDelete,
  MdEdit,
} from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { ChooseEditImage } from '../atoms/chooseEditImage';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { DRAWER_WIDTHS } from '../drawer';
import { GalleryListEditPanel } from '../panel/galleryListEditPanel';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { ImageGalleryBlockValue } from './types';

const GALLERY_IMAGE_HEIGHT = 300;

const Wrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Toolbar = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;

  @media (max-width: 599px) {
    grid-template-columns: minmax(0, 1fr) auto;

    & > :nth-child(2) {
      order: 3;
      grid-column: 1 / -1;
      justify-self: center;
    }
  }
`;

const ToolbarActions = styled('div')`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export function ImageGalleryBlock({
  value,
  onChange,
  autofocus,
  disabled,
}: BlockProps<ImageGalleryBlockValue>) {
  const [isGalleryListEditModalOpen, setGalleryListEditModalOpen] = useState(
    () => Boolean(autofocus) && !value.images[0].image
  );
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const [index, setIndex] = useState(0);

  const item = value.images[index];

  const image = item?.image;
  const caption = item?.caption ?? '';

  const hasPrevious = index > 0;
  const hasNext = index < value.images.length - 1;

  const isNewIndex = !image && !caption && index >= value.images.length;

  const { t } = useTranslation();

  function handleImageChange(image: FullImageFragment | null) {
    onChange({
      ...value,
      images: Object.assign([], value.images, {
        [index]: {
          image,
          caption,
        },
      }),
    });
  }

  function handleRemove() {
    if (isNewIndex) {
      setIndex(Math.max(value.images.length - 1, 0));

      return;
    }

    const images = value.images.filter((_image, at) => at !== index);

    setIndex(Math.min(index, Math.max(images.length - 1, 0)));
    onChange({ ...value, images });
  }

  function handleCaptionChange(caption: string) {
    onChange({
      ...value,
      images: Object.assign([], value.images, {
        [index]: {
          image,
          caption,
        },
      }),
    });
  }

  return (
    <Wrapper>
      <Toolbar>
        <div>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MdEdit />}
            onClick={() => setGalleryListEditModalOpen(true)}
            disabled={disabled}
          >
            {t('blocks.imageGallery.panels.editGallery')}
          </Button>
        </div>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {index + 1} / {Math.max(index + 1, value.images.length)}{' '}
          {isNewIndex ? t('blocks.imageGallery.overview.new') : ''}
        </Typography>

        <ToolbarActions>
          <IconButtonTooltip
            caption={t('blocks.imageGallery.overview.previousImage')}
          >
            <IconButton
              aria-label={t('blocks.imageGallery.overview.previousImage')}
              onClick={() => setIndex(index => index - 1)}
              disabled={disabled || !hasPrevious}
            >
              <MdArrowLeft />
            </IconButton>
          </IconButtonTooltip>

          <IconButtonTooltip
            caption={t('blocks.imageGallery.overview.nextImage')}
          >
            <IconButton
              aria-label={t('blocks.imageGallery.overview.nextImage')}
              onClick={() => setIndex(index => index + 1)}
              disabled={disabled || !hasNext}
            >
              <MdArrowRight />
            </IconButton>
          </IconButtonTooltip>

          <IconButtonTooltip
            caption={t('blocks.imageGallery.overview.addImage')}
          >
            <IconButton
              aria-label={t('blocks.imageGallery.overview.addImage')}
              onClick={() => setIndex(value.images.length)}
              disabled={disabled || isNewIndex}
            >
              <MdAddCircle />
            </IconButton>
          </IconButtonTooltip>

          <IconButtonTooltip
            caption={t('blocks.imageGallery.overview.removeImage')}
          >
            <IconButton
              color="error"
              aria-label={t('blocks.imageGallery.overview.removeImage')}
              onClick={handleRemove}
              disabled={
                disabled ||
                (isNewIndex ? !value.images.length : value.images.length < 2)
              }
            >
              <MdDelete />
            </IconButton>
          </IconButtonTooltip>
        </ToolbarActions>
      </Toolbar>

      <ChooseEditImage
        onSelect={(value: FullImageFragment | null) => {
          setChooseModalOpen(false);
          handleImageChange(value);
        }}
        image={image}
        disabled={!!disabled}
        maxHeight={GALLERY_IMAGE_HEIGHT}
        openChooseModalOpen={() => setChooseModalOpen(true)}
        openEditModalOpen={() => setEditModalOpen(true)}
        removeImage={() => handleImageChange(null)}
      />

      <TypographicTextArea
        variant="subtitle2"
        align="center"
        placeholder={t('blocks.imageGallery.overview.caption')}
        value={caption}
        disabled={disabled}
        onChange={e => {
          handleCaptionChange(e.target.value);
        }}
      />
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: FullImageFragment | null) => {
            setChooseModalOpen(false);
            handleImageChange(value);
          }}
        />
      </Drawer>

      {image && (
        <Drawer
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={image.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isGalleryListEditModalOpen}
        onClose={() => setGalleryListEditModalOpen(false)}
      >
        <GalleryListEditPanel
          initialImages={value.images}
          onSave={images => {
            onChange({ images });
            setGalleryListEditModalOpen(false);
          }}
          onClose={() => setGalleryListEditModalOpen(false)}
        />
      </Drawer>
    </Wrapper>
  );
}
