import styled from '@emotion/styled';
import { FullImageFragment } from '@wepublish/editor/api-v2';
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
import { Drawer, Dropdown, IconButton } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { GalleryListEditPanel } from '../panel/galleryListEditPanel';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { ImagePanel, Panel } from './imageBlock';
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
  margin-right: 5px;
`;

const RightArrow = styled(IconButton)`
  margin-right: 10px;
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
          <IconButton
            icon={<MdEdit />}
            onClick={() => setGalleryListEditModalOpen(true)}
            disabled={disabled}
          />
        </EditIconWrapper>
        <IsNewWrapper>
          <IsNew>
            {index + 1} / {Math.max(index + 1, value.images.length)}{' '}
            {isNewIndex ? '(New)' : ''}
          </IsNew>
        </IsNewWrapper>
        <LeftArrowWrapper>
          <LeftArrow
            icon={<MdArrowLeft />}
            onClick={() => setIndex(index => index - 1)}
            disabled={disabled || !hasPrevious}
          />
          <RightArrow
            icon={<MdArrowRight />}
            onClick={() => setIndex(index => index + 1)}
            disabled={disabled || !hasNext}
          />
          <IconButton
            icon={<MdAddCircle />}
            onClick={() => setIndex(value.images.length)}
            disabled={disabled || isNewIndex}
          />
        </LeftArrowWrapper>
      </Block>
      <Panel
        bordered
        bodyFill
      >
        <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
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
                    icon={<MdBuild />}
                    circle
                    appearance="subtle"
                  />
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
      </Panel>
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
        open={isChooseModalOpen}
        size="sm"
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
          open={isEditModalOpen}
          size="sm"
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
      <Drawer
        open={isGalleryListEditModalOpen}
        size="sm"
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
