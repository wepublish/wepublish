import { useApolloClient, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, IconButton, TextField } from '@mui/material';
import {
  VideoDocument,
  VideoListDocument,
  VideoStorageUsageDocument,
  FullVideoFragment,
  UpdateVideoDocument,
  UploadVideoDocument,
} from '@wepublish/editor/api';
import {
  CanCreateVideo,
  CanDeleteVideo,
  CanGetVideo,
  CanGetVideos,
} from '@wepublish/permissions';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';
import ReactPlayer from 'react-player';
import { z } from 'zod';

import { DescriptionList, DescriptionListItem } from '../atoms/descriptionList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms/permissionControl';
import {
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
  FormFields,
  FormSectionTitle,
} from '../drawer';
import { captureVideoPoster } from '../atoms/captureVideoPoster';
import { formatBitrate } from '../atoms/mediaBitrate';
import { readMediaMetadata } from '../atoms/readMediaMetadata';
import { enqueueSnackbar } from '../snackbar';
import { getOperationNameFromDocument } from '../utility';

const VideoPreview = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.vars.palette.common.black};

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const schema = z.object({
  title: z.string(),
  description: z.string(),
  source: z.string(),
  link: z.string(),
  license: z.string(),
  filename: z.string(),
  extension: z.string(),
  fileSize: z.number(),
  duration: z.number().optional(),
  poster: z.custom<Blob>().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  url: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type VideoDetails = z.infer<typeof schema>;

const EMPTY_VIDEO: VideoDetails = {
  title: '',
  description: '',
  source: '',
  link: '',
  license: '',
  filename: '',
  extension: '',
  fileSize: 0,
};

const fromFile = async (file: File): Promise<VideoDetails> => {
  const [measured, poster] = await Promise.all([
    readMediaMetadata(file),
    captureVideoPoster(file),
  ]);

  const dot = file.name.lastIndexOf('.');

  return {
    filename: dot > 0 ? file.name.slice(0, dot) : file.name,
    extension: dot > 0 ? file.name.slice(dot) : '',
    fileSize: file.size,
    title: '',
    description: '',
    source: '',
    link: '',
    license: '',
    ...measured,
    poster: poster ?? undefined,
    url: URL.createObjectURL(file),
  };
};

const fromVideo = (video: FullVideoFragment): VideoDetails => ({
  filename: video.filename || '',
  extension: video.extension,
  fileSize: video.fileSize,
  title: video.title ?? '',
  description: video.description ?? '',
  duration: video.duration ?? undefined,
  width: video.width ?? undefined,
  height: video.height ?? undefined,
  source: video.source ?? '',
  link: video.link ?? '',
  license: video.license ?? '',
  url: video.url,
  createdAt: video.createdAt,
  updatedAt: video.modifiedAt,
});

export interface VideoEditPanelProps {
  id?: string;
  file?: File;

  onClose?(): void;
  onReplace?(): void;
  onSave?(video: FullVideoFragment): void;
}

function VideoEditPanel({
  id,
  file,
  onClose,
  onReplace,
  onSave,
}: VideoEditPanelProps) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [loadError, setLoadError] = useState<Error>();

  const [updateVideo, { loading: isUpdating, error: savingError }] =
    useMutation(UpdateVideoDocument);

  const [uploadVideo, { loading: isUploading, error: uploadError }] =
    useMutation(UploadVideoDocument, {
      refetchQueries: [
        getOperationNameFromDocument(VideoListDocument),
        getOperationNameFromDocument(VideoStorageUsageDocument),
      ],
    });

  const {
    control,
    handleSubmit,
    formState: { isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      if (file) {
        return fromFile(file);
      }

      if (!id) {
        return EMPTY_VIDEO;
      }

      try {
        const { data } = await client.query({
          query: VideoDocument,
          variables: { id },
        });

        if (!data?.video) {
          enqueueSnackbar(t('videos.panels.notFound'), {
            variant: 'error',
            autoHideDuration: null,
          });

          return EMPTY_VIDEO;
        }

        return fromVideo(data.video);
      } catch (error) {
        setLoadError(error as Error);

        return EMPTY_VIDEO;
      }
    },
  });

  const details = useWatch({ control });

  const isAuthorized = useAuthorisation(CanCreateVideo.id);
  const isDisabled = isLoading || isUpdating || isUploading || !isAuthorized;
  const isUpload = file !== undefined;

  useEffect(() => {
    const localUrl = file ? details.url : undefined;

    return () => {
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [file, details.url]);

  useEffect(() => {
    const error =
      loadError?.message ?? savingError?.message ?? uploadError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadError, savingError, uploadError]);

  async function handleSave({
    title,
    description,
    source,
    link,
    license,
    poster,
  }: z.infer<typeof schema>) {
    try {
      if (isUpload) {
        const { data } = await uploadVideo({
          variables: {
            file: file!,
            filename: details.filename || undefined,
            title: title || undefined,
            description: description || undefined,
            source: source || undefined,
            link: link || undefined,
            license: license || undefined,
            duration: details.duration,
            width: details.width,
            height: details.height,
            poster:
              poster ?
                new File([poster], 'poster.jpg', { type: 'image/jpeg' })
              : undefined,
          },
        });

        if (data?.uploadVideo) {
          onSave?.(data.uploadVideo);
        }
      } else {
        const { data } = await updateVideo({
          variables: {
            id: id!,
            title: title || undefined,
            description: description || undefined,
            source: source || undefined,
            link: link || undefined,
            license: license || undefined,
          },
        });

        enqueueSnackbar(t('videos.panels.videoUpdated'), {
          variant: 'success',
          autoHideDuration: 2000,
        });

        if (data?.updateVideo) {
          onSave?.(data.updateVideo);
        }
      }
    } catch (err) {
      enqueueSnackbar(t('videos.panels.uploadFailed'), {
        variant: 'error',
        autoHideDuration: null,
      });
    }
  }

  return (
    <DrawerForm onSubmit={handleSubmit(handleSave)}>
      <DrawerHeader>
        <DrawerTitle>
          {isUpload ?
            t('videos.panels.uploadVideo')
          : t('videos.panels.editVideo')}
        </DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={[CanCreateVideo.id]}>
            <Button
              variant="contained"
              disabled={isDisabled}
              type="submit"
            >
              {isUpload ? t('videos.panels.upload') : t('save')}
            </Button>
          </PermissionControl>

          {isUpload && onReplace && (
            <Button
              variant="text"
              onClick={() => onReplace()}
            >
              {t('videos.panels.replaceFile')}
            </Button>
          )}

          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {isUpload ? t('videos.panels.cancel') : t('videos.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        {!isLoading && (
          <FormFields>
            {details.url && (
              <VideoPreview>
                <ReactPlayer
                  src={details.url}
                  controls
                  playsInline
                  width="100%"
                  height="100%"
                />
              </VideoPreview>
            )}

            <FormSectionTitle>
              {t('videos.panels.description')}
            </FormSectionTitle>

            <DescriptionList>
              <DescriptionListItem label={t('videos.panels.filename')}>
                {details.filename || t('videos.panels.untitled')}
                {details.extension}
              </DescriptionListItem>

              {details.createdAt && (
                <DescriptionListItem label={t('videos.panels.created')}>
                  {t('videos.panels.createdAt', {
                    createdAt: new Date(details.createdAt),
                  })}
                </DescriptionListItem>
              )}

              {details.updatedAt && (
                <DescriptionListItem label={t('videos.panels.updated')}>
                  {t('videos.panels.updatedAt', {
                    updatedAt: new Date(details.updatedAt),
                  })}
                </DescriptionListItem>
              )}

              {details.width && details.height && (
                <DescriptionListItem label={t('videos.panels.dimensions')}>
                  {t('videos.panels.dimensionsValue', {
                    width: details.width,
                    height: details.height,
                  })}
                </DescriptionListItem>
              )}

              {formatBitrate(details.fileSize ?? 0, details.duration) && (
                <DescriptionListItem label={t('videos.panels.bitrate')}>
                  {formatBitrate(details.fileSize ?? 0, details.duration)}
                </DescriptionListItem>
              )}

              <DescriptionListItem label={t('videos.panels.fileSize')}>
                {prettyBytes(details.fileSize ?? 0)}
              </DescriptionListItem>

              {!isUpload && details.url && (
                <DescriptionListItem label={t('videos.panels.publicLink')}>
                  <a
                    href={details.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('videos.panels.openOriginal')}
                  </a>

                  <IconButtonTooltip caption={t('videos.overview.copyLink')}>
                    <IconButton
                      aria-label={t('videos.overview.copyLink')}
                      size="small"
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        navigator.clipboard.writeText(details.url!);
                        enqueueSnackbar('', {
                          variant: 'success',
                          title: t('videos.panels.linkCopied'),
                          autoHideDuration: 2000,
                        });
                      }}
                    >
                      <MdContentCopy />
                    </IconButton>
                  </IconButtonTooltip>
                </DescriptionListItem>
              )}
            </DescriptionList>

            <FormSectionTitle>
              {t('videos.panels.information')}
            </FormSectionTitle>

            <Controller
              control={control}
              name="title"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('videos.panels.title')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('videos.panels.description')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <FormSectionTitle>
              {t('videos.panels.attribution')}
            </FormSectionTitle>

            <Controller
              control={control}
              name="source"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('videos.panels.source')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="link"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('videos.panels.link')}
                  placeholder={t('videos.panels.urlPlaceholder')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message ?? t('videos.panels.sourceLink')}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="license"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('videos.panels.license')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />
          </FormFields>
        )}
      </DrawerBody>
    </DrawerForm>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetVideo.id,
  CanGetVideos.id,
  CanDeleteVideo.id,
  CanCreateVideo.id,
])(VideoEditPanel);
export { CheckedPermissionComponent as VideoEditPanel };
