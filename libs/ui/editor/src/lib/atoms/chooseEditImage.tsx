import styled from '@emotion/styled';
import {
  ButtonBase,
  Drawer,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import { DragEvent, JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAddPhotoAlternate,
  MdClose,
  MdEdit,
  MdFileUpload,
  MdPhoto,
} from 'react-icons/md';

import { DRAWER_WIDTHS } from '../drawer';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { enqueueSnackbar } from '../snackbar';
import { IconButtonTooltip } from './iconButtonTooltip';
import { ImageMetaData, readImageMetaData } from './imageMetaData';

export interface ChooseEditImageProps {
  image?: FullImageFragment | null;
  disabled: boolean;
  openChooseModalOpen?: () => void;
  openEditModalOpen?: () => void;
  removeImage?: () => void;
  onSelect?: (image: FullImageFragment) => void;
  maxHeight?: number;
}

const Frame = styled.div<{ height: number }>`
  position: relative;
  overflow: hidden;
  width: 100%;
  height: ${({ height }) => height}px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const Choose = styled(ButtonBase)`
  width: 100%;
  height: 100%;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px dashed ${({ theme }) => theme.vars.palette.action.disabled};
  border-radius: inherit;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  transition: ${({ theme }) =>
    theme.transitions.create(['border-color', 'background-color', 'color'])};

  &:hover,
  &.Mui-focusVisible {
    border-color: ${({ theme }) => theme.vars.palette.primary.main};
    color: ${({ theme }) => theme.vars.palette.primary.main};
    background-color: rgba(
      ${({ theme }) => theme.vars.palette.primary.mainChannel} / 0.08
    );
  }

  &.Mui-disabled {
    opacity: 0.5;
  }

  &[data-dragging='true'] {
    border-color: ${({ theme }) => theme.vars.palette.primary.main};
    color: ${({ theme }) => theme.vars.palette.primary.main};
    background-color: rgba(
      ${({ theme }) => theme.vars.palette.primary.mainChannel} / 0.08
    );
  }

  svg {
    font-size: 28px;
  }
`;

const DropIcon = styled(MdFileUpload)`
  && {
    font-size: 1.25rem;
  }
`;

const Backdrop = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(24px);
  transform: scale(1.2);
  opacity: 0.4;
`;

const Figure = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: inherit;
  overflow: hidden;
`;

const Image = styled.img`
  position: relative;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const Actions = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing(1)};
  right: ${({ theme }) => theme.spacing(1)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(0.25)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);

  .MuiIconButton-root {
    color: #fff;
  }

  .MuiIconButton-root.Mui-disabled {
    color: rgba(255, 255, 255, 0.4);
  }
`;

export function ChooseEditImage({
  image,
  disabled,
  openChooseModalOpen,
  openEditModalOpen,
  removeImage,
  onSelect,
  maxHeight = 240,
}: ChooseEditImageProps): JSX.Element {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [droppedMetaData, setDroppedMetaData] = useState<ImageMetaData>();

  const takesFiles = Boolean(onSelect) && !disabled;

  const carriesFile = (event: DragEvent) =>
    event.dataTransfer?.types?.includes('Files') ?? false;

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer?.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image')) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('articleEditor.panels.invalidImage'),
        autoHideDuration: 5000,
      });

      return;
    }

    setDroppedMetaData(await readImageMetaData(file));
    setDroppedFile(file);
  };

  const uploadStep = droppedFile && (
    <Drawer
      anchor="right"
      open
      slotProps={{
        paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
      }}
      onClose={() => setDroppedFile(null)}
    >
      <ImageEditPanel
        file={droppedFile}
        imageMetaData={droppedMetaData}
        onClose={() => setDroppedFile(null)}
        onSave={uploadedImage => {
          setDroppedFile(null);
          onSelect?.(uploadedImage);
        }}
      />
    </Drawer>
  );

  if (!image) {
    return (
      <Frame height={maxHeight}>
        {disabled ?
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation={false}
          />
        : null}

        <Choose
          disabled={disabled}
          aria-label={t('chooseEditImage.chooseImage')}
          data-dragging={dragging ? 'true' : undefined}
          onClick={() => openChooseModalOpen?.()}
          onDragEnter={
            takesFiles ?
              event => carriesFile(event) && setDragging(true)
            : undefined
          }
          onDragOver={
            takesFiles ?
              event => carriesFile(event) && event.preventDefault()
            : undefined
          }
          onDragLeave={takesFiles ? () => setDragging(false) : undefined}
          onDrop={takesFiles ? handleDrop : undefined}
        >
          {dragging ?
            <DropIcon />
          : <MdAddPhotoAlternate />}

          <Typography variant="body2">
            {dragging ?
              t('articleEditor.panels.dropImage')
            : t('chooseEditImage.chooseImage')}
          </Typography>
        </Choose>

        {uploadStep}
      </Frame>
    );
  }

  const source = image.largeURL ?? '/static/placeholder-240x240.png';

  return (
    <Frame height={maxHeight}>
      <Figure>
        <Backdrop
          src={source}
          alt=""
          aria-hidden
        />

        <Image
          src={source}
          alt={image.title ?? ''}
        />

        <Actions>
          {openChooseModalOpen && (
            <IconButtonTooltip caption={t('chooseEditImage.chooseImage')}>
              <IconButton
                size="small"
                disabled={disabled}
                aria-label={t('chooseEditImage.chooseImage')}
                onClick={openChooseModalOpen}
              >
                <MdPhoto />
              </IconButton>
            </IconButtonTooltip>
          )}

          {openEditModalOpen && (
            <IconButtonTooltip caption={t('chooseEditImage.editImage')}>
              <IconButton
                size="small"
                disabled={disabled}
                aria-label={t('chooseEditImage.editImage')}
                onClick={openEditModalOpen}
              >
                <MdEdit />
              </IconButton>
            </IconButtonTooltip>
          )}

          {removeImage && (
            <IconButtonTooltip caption={t('chooseEditImage.removeImage')}>
              <IconButton
                size="small"
                disabled={disabled}
                aria-label={t('chooseEditImage.removeImage')}
                onClick={removeImage}
              >
                <MdClose />
              </IconButton>
            </IconButtonTooltip>
          )}
        </Actions>
      </Figure>

      {uploadStep}
    </Frame>
  );
}
