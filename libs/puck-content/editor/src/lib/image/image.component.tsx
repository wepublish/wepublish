import styled from '@emotion/styled';
import {
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { useImageQuery } from '@wepublish/editor/api';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { MdAddPhotoAlternate, MdClose, MdEdit } from 'react-icons/md';

import { ImageDialog } from './image-dialog';
import { ImageField, ImageValue } from './image.field';

const Dropzone = styled.div<{ active: boolean; disabled: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 140px;
  padding: 12px;
  border: 2px dashed
    ${({ active, theme }) =>
      active ? theme.palette.primary.main : theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ active, theme }) =>
    active ? theme.palette.action.hover : 'transparent'};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  overflow: hidden;
  text-align: center;
`;

const Thumbnail = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Actions = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;

  button {
    color: ${({ theme }) => theme.palette.common.white};
    background: rgba(0, 0, 0, 0.55);

    &:hover {
      background: rgba(0, 0, 0, 0.75);
    }
  }
`;

export type ImageFieldRenderProps = FieldProps<
  ImageField,
  ImageValue | undefined
>;

export const ImageFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: ImageFieldRenderProps) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const { data, loading } = useImageQuery({
    variables: { id: value ?? '' },
    skip: !value,
  });
  const image = value ? data?.image : undefined;

  const openDialog = (file: File | null = null) => {
    setDroppedFile(file);
    setDialogOpen(true);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: readOnly,
    onDrop: files => files[0] && openDialog(files[0]),
  });

  return (
    <FieldLabel
      label={field.label ?? t('', 'Image')}
      readOnly={readOnly}
      el="div"
    >
      <Dropzone
        {...getRootProps()}
        active={isDragActive}
        disabled={!!readOnly}
      >
        <input {...getInputProps()} />

        {image && (
          <Thumbnail
            src={image.mediumURL ?? image.url}
            alt={image.title ?? ''}
          />
        )}

        {loading && <CircularProgress size={24} />}

        {!value && !loading && (
          <>
            <Button
              variant="contained"
              size="small"
              startIcon={<MdAddPhotoAlternate />}
              disabled={readOnly}
              onClick={() => openDialog()}
            >
              {t('', 'Choose image')}
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {t('', 'or drop an image here')}
            </Typography>
          </>
        )}

        {value && !readOnly && (
          <Actions>
            <IconButton
              size="small"
              title={t('', 'Edit')}
              onClick={() => openDialog()}
            >
              <MdEdit size={18} />
            </IconButton>

            <IconButton
              size="small"
              title={t('', 'Remove')}
              onClick={() => onChange(undefined)}
            >
              <MdClose size={18} />
            </IconButton>
          </Actions>
        )}
      </Dropzone>

      <ImageDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={onChange}
        image={image ?? undefined}
        file={droppedFile}
      />
    </FieldLabel>
  );
};
