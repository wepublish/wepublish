import styled from '@emotion/styled';
import { CircularProgress, IconButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  MdCheckCircle,
  MdClose,
  MdErrorOutline,
  MdImage,
  MdRefresh,
  MdSchedule,
} from 'react-icons/md';

import { IconButtonTooltip } from './iconButtonTooltip';
import { ImageUpload } from './imageUploadQueue';

export const ImageUploadTileWrapper = styled.li`
  position: relative;
  display: grid;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};

  &[data-status='failed'] {
    border-color: ${({ theme }) => theme.vars.palette.error.main};
  }
`;

export const ImageUploadPreview = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 32px;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ImageUploadStatusIcon = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background-color: rgba(
    ${({ theme }) => theme.vars.palette.background.paperChannel} / 0.6
  );
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 28px;

  &[data-status='done'] {
    color: ${({ theme }) => theme.vars.palette.success.main};
  }

  &[data-status='failed'] {
    color: ${({ theme }) => theme.vars.palette.error.main};
  }
`;

export const ImageUploadCaption = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.25)};
  padding: ${({ theme }) => theme.spacing(1, 1.5)};
  min-width: 0;
`;

export const ImageUploadActions = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing(0.5)};
  right: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.25)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
`;

export interface ImageUploadTileProps {
  upload: ImageUpload;
  onRetry(): void;
  onRemove(): void;
}

export function ImageUploadTile({
  upload,
  onRetry,
  onRemove,
}: ImageUploadTileProps) {
  const { t } = useTranslation();
  const { file, status, previewUrl, canRetry, errorMessage } = upload;

  const statusText =
    status === 'queued' ? t('images.panels.uploadQueued')
    : status === 'uploading' ? t('images.panels.uploading')
    : status === 'done' ? t('images.panels.uploaded')
    : (errorMessage ?? t('images.panels.uploadFailed'));

  return (
    <ImageUploadTileWrapper data-status={status}>
      <ImageUploadPreview>
        {previewUrl ?
          <img
            src={previewUrl}
            alt=""
          />
        : <MdImage aria-hidden />}

        <ImageUploadStatusIcon
          data-status={status}
          aria-hidden
        >
          {status === 'queued' && <MdSchedule />}
          {status === 'uploading' && <CircularProgress size={28} />}
          {status === 'done' && <MdCheckCircle />}
          {status === 'failed' && <MdErrorOutline />}
        </ImageUploadStatusIcon>
      </ImageUploadPreview>

      <ImageUploadCaption>
        <Typography
          variant="caption"
          noWrap
          title={file.name}
        >
          {file.name}
        </Typography>

        <Typography
          variant="caption"
          color={status === 'failed' ? 'error' : 'text.secondary'}
        >
          {statusText}
        </Typography>
      </ImageUploadCaption>

      {status === 'failed' && (
        <ImageUploadActions>
          {canRetry && (
            <IconButtonTooltip caption={t('images.panels.retryUpload')}>
              <IconButton
                size="small"
                aria-label={t('images.panels.retryUploadOf', {
                  name: file.name,
                })}
                onClick={onRetry}
              >
                <MdRefresh />
              </IconButton>
            </IconButtonTooltip>
          )}

          <IconButtonTooltip caption={t('images.panels.removeUpload')}>
            <IconButton
              size="small"
              aria-label={t('images.panels.removeUploadOf', {
                name: file.name,
              })}
              onClick={onRemove}
            >
              <MdClose />
            </IconButton>
          </IconButtonTooltip>
        </ImageUploadActions>
      )}
    </ImageUploadTileWrapper>
  );
}
