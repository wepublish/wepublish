import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, IconButton, TextField } from '@mui/material';
import {
  DocumentDocument,
  DocumentListDocument,
  FullDocumentFragment,
  UpdateDocumentDocument,
  UploadDocumentDocument,
} from '@wepublish/editor/api';
import {
  CanCreateDocument,
  CanDeleteDocument,
  CanGetDocument,
  CanGetDocuments,
} from '@wepublish/permissions';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
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
  FormFields,
  FormSectionTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { getOperationNameFromDocument } from '../utility';

const schema = z.object({
  title: z.string(),
  description: z.string(),
  filename: z.string(),
  extension: z.string(),
  fileSize: z.number(),
  url: z.string().optional(),
  thumbnailURL: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type DocumentDetails = z.infer<typeof schema>;

const EMPTY_DOCUMENT: DocumentDetails = {
  title: '',
  description: '',
  filename: '',
  extension: '',
  fileSize: 0,
};

const fromFile = (file: File): DocumentDetails => {
  const dot = file.name.lastIndexOf('.');

  return {
    filename: dot > 0 ? file.name.slice(0, dot) : file.name,
    extension: dot > 0 ? file.name.slice(dot) : '',
    fileSize: file.size,
    title: '',
    description: '',
  };
};

const fromDocument = (document: FullDocumentFragment): DocumentDetails => ({
  filename: document.filename || '',
  extension: document.extension,
  fileSize: document.fileSize,
  title: document.title ?? '',
  description: document.description ?? '',
  url: document.url,
  thumbnailURL: document.thumbnailURL ?? undefined,
  createdAt: document.createdAt,
  updatedAt: document.modifiedAt,
});

export interface DocumentEditPanelProps {
  id?: string;
  file?: File;

  onClose?(): void;
  onReplace?(): void;
  onSave?(document: FullDocumentFragment): void;
}

function DocumentEditPanel({
  id,
  file,
  onClose,
  onReplace,
  onSave,
}: DocumentEditPanelProps) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [loadError, setLoadError] = useState<Error>();

  const [updateDocument, { loading: isUpdating, error: savingError }] =
    useMutation(UpdateDocumentDocument);

  const [uploadDocument, { loading: isUploading, error: uploadError }] =
    useMutation(UploadDocumentDocument, {
      refetchQueries: [getOperationNameFromDocument(DocumentListDocument)],
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
        return EMPTY_DOCUMENT;
      }

      try {
        const { data } = await client.query({
          query: DocumentDocument,
          variables: { id },
        });

        if (!data?.document) {
          enqueueSnackbar(t('documents.panels.notFound'), {
            variant: 'error',
            autoHideDuration: null,
          });

          return EMPTY_DOCUMENT;
        }

        return fromDocument(data.document);
      } catch (error) {
        setLoadError(error as Error);

        return EMPTY_DOCUMENT;
      }
    },
  });

  const details = useWatch({ control });

  const isAuthorized = useAuthorisation(CanCreateDocument.id);
  const isDisabled = isLoading || isUpdating || isUploading || !isAuthorized;
  const isUpload = file !== undefined;

  useEffect(() => {
    const error =
      loadError?.message ?? savingError?.message ?? uploadError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadError, savingError, uploadError]);

  async function handleSave({ title, description }: z.infer<typeof schema>) {
    try {
      if (isUpload) {
        const { data } = await uploadDocument({
          variables: {
            file: file!,
            filename: details.filename || undefined,
            title: title || undefined,
            description: description || undefined,
          },
        });

        if (data?.uploadDocument) {
          onSave?.(data.uploadDocument);
        }
      } else {
        const { data } = await updateDocument({
          variables: {
            id: id!,
            title: title || undefined,
            description: description || undefined,
          },
        });

        enqueueSnackbar(t('documents.panels.documentUpdated'), {
          variant: 'success',
          autoHideDuration: 2000,
        });

        if (data?.updateDocument) {
          onSave?.(data.updateDocument);
        }
      }
    } catch (err) {
      enqueueSnackbar(t('documents.panels.uploadFailed'), {
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
            t('documents.panels.uploadDocument')
          : t('documents.panels.editDocument')}
        </DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={[CanCreateDocument.id]}>
            <Button
              variant="contained"
              disabled={isDisabled}
              type="submit"
            >
              {isUpload ? t('documents.panels.upload') : t('save')}
            </Button>
          </PermissionControl>

          {isUpload && onReplace && (
            <Button
              variant="text"
              onClick={() => onReplace()}
            >
              {t('documents.panels.replaceFile')}
            </Button>
          )}

          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {isUpload ?
              t('documents.panels.cancel')
            : t('documents.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        {!isLoading && (
          <FormFields>
            {details.thumbnailURL && (
              <img
                src={details.thumbnailURL}
                alt={details.title || details.filename}
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            )}

            <FormSectionTitle>
              {t('documents.panels.description')}
            </FormSectionTitle>

            <DescriptionList>
              <DescriptionListItem label={t('documents.panels.filename')}>
                {details.filename || t('documents.panels.untitled')}
                {details.extension}
              </DescriptionListItem>

              {details.createdAt && (
                <DescriptionListItem label={t('documents.panels.created')}>
                  {t('documents.panels.createdAt', {
                    createdAt: new Date(details.createdAt),
                  })}
                </DescriptionListItem>
              )}

              {details.updatedAt && (
                <DescriptionListItem label={t('documents.panels.updated')}>
                  {t('documents.panels.updatedAt', {
                    updatedAt: new Date(details.updatedAt),
                  })}
                </DescriptionListItem>
              )}

              <DescriptionListItem label={t('documents.panels.fileSize')}>
                {prettyBytes(details.fileSize ?? 0)}
              </DescriptionListItem>

              {!isUpload && details.url && (
                <DescriptionListItem label={t('documents.panels.publicLink')}>
                  <a
                    href={details.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('documents.panels.openOriginal')}
                  </a>

                  <IconButtonTooltip caption={t('documents.overview.copyLink')}>
                    <IconButton
                      aria-label={t('documents.overview.copyLink')}
                      size="small"
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        navigator.clipboard.writeText(details.url!);
                        enqueueSnackbar('', {
                          variant: 'success',
                          title: t('documents.panels.linkCopied'),
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
              {t('documents.panels.information')}
            </FormSectionTitle>

            <Controller
              control={control}
              name="title"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('documents.panels.title')}
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
                  label={t('documents.panels.description')}
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
  CanGetDocument.id,
  CanGetDocuments.id,
  CanDeleteDocument.id,
  CanCreateDocument.id,
])(DocumentEditPanel);
export { CheckedPermissionComponent as DocumentEditPanel };
