import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import {
  VideoDocument,
  VideoListDocument,
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
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';

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
} from '../drawer';
import { useSeededState } from '../hooks/use-seeded-state';
import { enqueueSnackbar } from '../snackbar';
import { getOperationNameFromDocument } from '../utility';

export interface VideoEditPanelProps {
  id?: string;
  file?: File;

  onClose?(): void;
  onSave?(video: FullVideoFragment): void;
}

function VideoEditPanel({ id, file, onClose, onSave }: VideoEditPanelProps) {
  const [filename, setFilename] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [fileSize, setFileSize] = useState(0);
  const [extension, setExtension] = useState('');

  const [videoURL, setVideoURL] = useState<string>();

  const [createdAt, setCreatedAt] = useState<string>();
  const [updatedAt, setUpdatedAt] = useState<string>();

  const { data, error: loadingError } = useQuery(VideoDocument, {
    variables: { id: id! },
    skip: id === undefined,
  });

  const [updateVideo, { loading: isUpdating, error: savingError }] =
    useMutation(UpdateVideoDocument);

  const [uploadVideo, { loading: isUploading, error: uploadError }] =
    useMutation(UploadVideoDocument, {
      refetchQueries: [getOperationNameFromDocument(VideoListDocument)],
    });

  const [isLoading, setLoading] = useState(true);
  const isAuthorized = useAuthorisation(CanCreateVideo.id);
  const isDisabled = isLoading || isUpdating || isUploading || !isAuthorized;
  const isUpload = file !== undefined;
  const { t } = useTranslation();

  useSeededState(file, picked => {
    const extensions = picked.name.split('.').slice(1);

    setCreatedAt(undefined);
    setUpdatedAt(undefined);
    setVideoURL(undefined);
    setFilename(picked.name);
    setFileSize(picked.size);
    setExtension(`.${extensions.join('.')}`);
    setLoading(false);
  });

  useSeededState(file ? undefined : data?.video, video => {
    setCreatedAt(video.createdAt);
    setUpdatedAt(video.modifiedAt);
    setFilename(video.filename || '');
    setFileSize(video.fileSize);
    setExtension(video.extension);
    setTitle(video.title ?? '');
    setDescription(video.description ?? '');
    setVideoURL(video.url);
    setLoading(false);
  });

  useEffect(() => {
    if (!file && data && !data.video) {
      enqueueSnackbar(t('videos.panels.notFound'), {
        variant: 'error',
        autoHideDuration: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, data]);

  useEffect(() => {
    const error =
      loadingError?.message ?? savingError?.message ?? uploadError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadingError, savingError, uploadError]);

  async function handleSave() {
    try {
      if (isUpload) {
        const { data } = await uploadVideo({
          variables: {
            file: file!,
            filename: filename || undefined,
            title: title || undefined,
            description: description || undefined,
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
    <DrawerForm
      onSubmit={event => {
        event.preventDefault();
        handleSave();
      }}
    >
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
          <>
            {videoURL && (
              <Card>
                <CardContent>
                  <video
                    src={videoURL}
                    controls
                    preload="metadata"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 300,
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader title={t('videos.panels.description')} />

              <CardContent>
                <DescriptionList>
                  <DescriptionListItem label={t('videos.panels.filename')}>
                    {filename || t('videos.panels.untitled')}
                    {extension}
                  </DescriptionListItem>

                  {createdAt && (
                    <DescriptionListItem label={t('videos.panels.created')}>
                      {t('videos.panels.createdAt', {
                        createdAt: new Date(createdAt),
                      })}
                    </DescriptionListItem>
                  )}

                  {updatedAt && (
                    <DescriptionListItem label={t('videos.panels.updated')}>
                      {t('videos.panels.updatedAt', {
                        updatedAt: new Date(updatedAt),
                      })}
                    </DescriptionListItem>
                  )}

                  <DescriptionListItem label={t('videos.panels.fileSize')}>
                    {prettyBytes(fileSize)}
                  </DescriptionListItem>

                  {videoURL && (
                    <DescriptionListItem label={t('videos.panels.publicLink')}>
                      <a
                        href={videoURL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {videoURL}
                      </a>

                      <IconButtonTooltip
                        caption={t('videos.overview.copyLink')}
                      >
                        <IconButton
                          aria-label={t('videos.overview.copyLink')}
                          size="small"
                          style={{ marginLeft: 8 }}
                          onClick={() => {
                            navigator.clipboard.writeText(videoURL);
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={t('videos.panels.information')} />

              <CardContent>
                <Stack
                  spacing={3}
                  sx={{ width: '100%' }}
                >
                  <TextField
                    label={t('videos.panels.title')}
                    name="title"
                    value={title}
                    disabled={isDisabled}
                    onChange={event => setTitle(event.target.value)}
                    fullWidth
                  />

                  <TextField
                    label={t('videos.panels.description')}
                    name="description"
                    value={description}
                    disabled={isDisabled}
                    onChange={event => setDescription(event.target.value)}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          </>
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
