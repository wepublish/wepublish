import styled from '@emotion/styled';
import { Card, CardContent, Drawer, IconButton } from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAddCircle,
  MdArrowLeft,
  MdArrowRight,
  MdBuild,
  MdEdit,
  MdPhoto,
} from 'react-icons/md';
import { Dropdown } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { DRAWER_WIDTHS } from '../drawer';
import { GalleryListEditPanel } from '../panel/galleryListEditPanel';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { ImagePanel } from './imageBlock';
import { ImageGalleryBlockValue } from './types';

const Block = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const EditIconWrapper = styled.div`
  flex-basis: 0;
  flex-grow: 1;
  flex-shrink: 1;
`;

const IsNewWrapper = styled.div`
  display: flex;
  flex-basis: 0;
  justify-content: center;
  flex-grow: 1;
  flex-shrink: 1;
`;

const LeftArrowWrapper = styled.div`
  display: flex;
  flex-basis: 0;
  justify-content: flex-end;
  flex-grow: 1;
  flex-shrink: 1;
`;

const IsNew = styled.p`
  color: grey;
`;

const LeftArrow = styled(IconButton)`
  margin-right: 4px;
`;

const RightArrow = styled(IconButton)`
  margin-right: 8px;
`;

export function ImageGalleryBlock({
  value,
  onChange,
  autofocus,
  disabled,
}: BlockProps<ImageGalleryBlockValue>) {
  const [isGalleryListEditModalOpen, setGalleryListEditModalOpen] =
    useState(false);

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

  useEffect(() => {
    if (autofocus && !value.images[0].image) {
      setGalleryListEditModalOpen(true);
    }
  }, []);

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
    <>
      <Block>
        <EditIconWrapper>
          <IconButtonTooltip
            caption={t('blocks.imageGallery.panels.editGallery')}
          >
            <IconButton
              aria-label={t('blocks.imageGallery.panels.editGallery')}
              onClick={() => setGalleryListEditModalOpen(true)}
              disabled={disabled}
            >
              <MdEdit />
            </IconButton>
          </IconButtonTooltip>
        </EditIconWrapper>
        <IsNewWrapper>
          <IsNew>
            {index + 1} / {Math.max(index + 1, value.images.length)}{' '}
            {isNewIndex ? t('blocks.imageGallery.overview.new') : ''}
          </IsNew>
        </IsNewWrapper>
        <LeftArrowWrapper>
          <IconButtonTooltip
            caption={t('blocks.imageGallery.overview.previousImage')}
          >
            <LeftArrow
              aria-label={t('blocks.imageGallery.overview.previousImage')}
              onClick={() => setIndex(index => index - 1)}
              disabled={disabled || !hasPrevious}
            >
              <MdArrowLeft />
            </LeftArrow>
          </IconButtonTooltip>
          <IconButtonTooltip
            caption={t('blocks.imageGallery.overview.nextImage')}
          >
            <RightArrow
              aria-label={t('blocks.imageGallery.overview.nextImage')}
              onClick={() => setIndex(index => index + 1)}
              disabled={disabled || !hasNext}
            >
              <MdArrowRight />
            </RightArrow>
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
        </LeftArrowWrapper>
      </Block>
      <Card variant="outlined">
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <PlaceholderInput
            onAddClick={() => setChooseModalOpen(true)}
            addLabel={t('blocks.image.overview.chooseImage')}
          >
            {image && (
              <ImagePanel image={image}>
                <Dropdown
                  renderToggle={(
                    props: object,
                    ref: React.Ref<HTMLButtonElement>
                  ) => (
                    <IconButton
                      {...props}
                      ref={ref}
                      data-on-media
                      title={t('chooseEditImage.imageOptions')}
                      aria-label={t('chooseEditImage.imageOptions')}
                    >
                      <MdBuild />
                    </IconButton>
                  )}
                >
                  <Dropdown.Item onClick={() => setChooseModalOpen(true)}>
                    <MdPhoto /> {t('blocks.image.overview.chooseImage')}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setEditModalOpen(true)}>
                    <MdEdit /> {t('blocks.image.overview.editImage')}
                  </Dropdown.Item>
                  {/* TODO: Meta sync */}
                </Dropdown>
              </ImagePanel>
            )}
          </PlaceholderInput>
        </CardContent>
      </Card>
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
              display: 'flex',
              flexDirection: 'column',
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
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
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
    </>
  );
}
