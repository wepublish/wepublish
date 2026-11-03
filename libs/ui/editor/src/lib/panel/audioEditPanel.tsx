import { useApolloClient, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, IconButton, TextField } from '@mui/material';
import {
  AudioDocument,
  AudioListDocument,
  AudioStorageUsageDocument,
  FullAudioFragment,
  UpdateAudioDocument,
  UploadAudioDocument,
} from '@wepublish/editor/api';
import {
  CanCreateAudio,
  CanDeleteAudio,
  CanGetAudio,
  CanGetAudios,
} from '@wepublish/permissions';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';
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
import { formatBitrate } from '../atoms/mediaBitrate';
import { readMediaMetadata } from '../atoms/readMediaMetadata';
import { enqueueSnackbar } from '../snackbar';
import { getOperationNameFromDocument } from '../utility';

const AudioPreview = styled.audio`
  width: 100%;
  display: block;
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
  url: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type AudioDetails = z.infer<typeof schema>;

const EMPTY_AUDIO: AudioDetails = {
  title: '',
  description: '',
  source: '',
  link: '',
  license: '',
  filename: '',
  extension: '',
  fileSize: 0,
};

const fromFile = async (file: File): Promise<AudioDetails> => {
  const measured = await readMediaMetadata(file);

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
    url: URL.createObjectURL(file),
  };
};

const fromAudio = (audio: FullAudioFragment): AudioDetails => ({
  filename: audio.filename || '',
  extension: audio.extension,
  fileSize: audio.fileSize,
  title: audio.title ?? '',
  description: audio.description ?? '',
  duration: audio.duration ?? undefined,
  source: audio.source ?? '',
  link: audio.link ?? '',
  license: audio.license ?? '',
  url: audio.url,
  createdAt: audio.createdAt,
  updatedAt: audio.modifiedAt,
});

export interface AudioEditPanelProps {
  id?: string;
  file?: File;

  onClose?(): void;
  onReplace?(): void;
  onSave?(audio: FullAudioFragment): void;
}

function AudioEditPanel({
  id,
  file,
  onClose,
  onReplace,
  onSave,
}: AudioEditPanelProps) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [loadError, setLoadError] = useState<Error>();

  const [updateAudio, { loading: isUpdating, error: savingError }] =
    useMutation(UpdateAudioDocument);

  const [uploadAudio, { loading: isUploading, error: uploadError }] =
    useMutation(UploadAudioDocument, {
      refetchQueries: [
        getOperationNameFromDocument(AudioListDocument),
        getOperationNameFromDocument(AudioStorageUsageDocument),
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
        return EMPTY_AUDIO;
      }

      try {
        const { data } = await client.query({
          query: AudioDocument,
          variables: { id },
        });

        if (!data?.audio) {
          enqueueSnackbar(t('audio.panels.notFound'), {
            variant: 'error',
            autoHideDuration: null,
          });

          return EMPTY_AUDIO;
        }

        return fromAudio(data.audio);
      } catch (error) {
        setLoadError(error as Error);

        return EMPTY_AUDIO;
      }
    },
  });

  const details = useWatch({ control });

  const isAuthorized = useAuthorisation(CanCreateAudio.id);
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
  }: z.infer<typeof schema>) {
    try {
      if (isUpload) {
        const { data } = await uploadAudio({
          variables: {
            file: file!,
            filename: details.filename || undefined,
            title: title || undefined,
            description: description || undefined,
            source: source || undefined,
            link: link || undefined,
            license: license || undefined,
            duration: details.duration,
          },
        });

        if (data?.uploadAudio) {
          onSave?.(data.uploadAudio);
        }
      } else {
        const { data } = await updateAudio({
          variables: {
            id: id!,
            title: title || undefined,
            description: description || undefined,
            source: source || undefined,
            link: link || undefined,
            license: license || undefined,
          },
        });

        enqueueSnackbar(t('audio.panels.audioUpdated'), {
          variant: 'success',
          autoHideDuration: 2000,
        });

        if (data?.updateAudio) {
          onSave?.(data.updateAudio);
        }
      }
    } catch (err) {
      enqueueSnackbar(t('audio.panels.uploadFailed'), {
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
            t('audio.panels.uploadAudio')
          : t('audio.panels.editAudio')}
        </DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={[CanCreateAudio.id]}>
            <Button
              variant="contained"
              disabled={isDisabled}
              type="submit"
            >
              {isUpload ? t('audio.panels.upload') : t('save')}
            </Button>
          </PermissionControl>

          {isUpload && onReplace && (
            <Button
              variant="text"
              onClick={() => onReplace()}
            >
              {t('audio.panels.replaceFile')}
            </Button>
          )}

          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {isUpload ? t('audio.panels.cancel') : t('audio.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        {!isLoading && (
          <FormFields>
            {details.url && (
              <AudioPreview
                src={details.url}
                controls
                preload="metadata"
              />
            )}

            <FormSectionTitle>{t('audio.panels.description')}</FormSectionTitle>

            <DescriptionList>
              <DescriptionListItem label={t('audio.panels.filename')}>
                {details.filename || t('audio.panels.untitled')}
                {details.extension}
              </DescriptionListItem>

              {details.createdAt && (
                <DescriptionListItem label={t('audio.panels.created')}>
                  {t('audio.panels.createdAt', {
                    createdAt: new Date(details.createdAt),
                  })}
                </DescriptionListItem>
              )}

              {details.updatedAt && (
                <DescriptionListItem label={t('audio.panels.updated')}>
                  {t('audio.panels.updatedAt', {
                    updatedAt: new Date(details.updatedAt),
                  })}
                </DescriptionListItem>
              )}

              {formatBitrate(details.fileSize ?? 0, details.duration) && (
                <DescriptionListItem label={t('audio.panels.bitrate')}>
                  {formatBitrate(details.fileSize ?? 0, details.duration)}
                </DescriptionListItem>
              )}

              <DescriptionListItem label={t('audio.panels.fileSize')}>
                {prettyBytes(details.fileSize ?? 0)}
              </DescriptionListItem>

              {!isUpload && details.url && (
                <DescriptionListItem label={t('audio.panels.publicLink')}>
                  <a
                    href={details.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('audio.panels.openOriginal')}
                  </a>

                  <IconButtonTooltip caption={t('audio.overview.copyLink')}>
                    <IconButton
                      aria-label={t('audio.overview.copyLink')}
                      size="small"
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        navigator.clipboard.writeText(details.url!);
                        enqueueSnackbar('', {
                          variant: 'success',
                          title: t('audio.panels.linkCopied'),
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

            <FormSectionTitle>{t('audio.panels.information')}</FormSectionTitle>

            <Controller
              control={control}
              name="title"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('audio.panels.title')}
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
                  label={t('audio.panels.description')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <FormSectionTitle>{t('audio.panels.attribution')}</FormSectionTitle>

            <Controller
              control={control}
              name="source"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('audio.panels.source')}
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
                  label={t('audio.panels.link')}
                  placeholder={t('audio.panels.urlPlaceholder')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message ?? t('audio.panels.sourceLink')}
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
                  label={t('audio.panels.license')}
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
  CanGetAudio.id,
  CanGetAudios.id,
  CanDeleteAudio.id,
  CanCreateAudio.id,
])(AudioEditPanel);
export { CheckedPermissionComponent as AudioEditPanel };
