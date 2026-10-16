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

export interface DocumentEditPanelProps {
  id?: string;
  file?: File;

  onClose?(): void;
  onSave?(document: FullDocumentFragment): void;
}

function DocumentEditPanel({
  id,
  file,
  onClose,
  onSave,
}: DocumentEditPanelProps) {
  const [filename, setFilename] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [fileSize, setFileSize] = useState(0);
  const [extension, setExtension] = useState('');

  const [documentURL, setDocumentURL] = useState<string>();
  const [thumbnailURL, setThumbnailURL] = useState<string>();

  const [createdAt, setCreatedAt] = useState<string>();
  const [updatedAt, setUpdatedAt] = useState<string>();

  const { data, error: loadingError } = useQuery(DocumentDocument, {
    variables: { id: id! },
    skip: id === undefined,
  });

  const [updateDocument, { loading: isUpdating, error: savingError }] =
    useMutation(UpdateDocumentDocument);

  const [uploadDocument, { loading: isUploading, error: uploadError }] =
    useMutation(UploadDocumentDocument, {
      refetchQueries: [getOperationNameFromDocument(DocumentListDocument)],
    });

  const [isLoading, setLoading] = useState(true);
  const isAuthorized = useAuthorisation(CanCreateDocument.id);
  const isDisabled = isLoading || isUpdating || isUploading || !isAuthorized;
  const isUpload = file !== undefined;
  const { t } = useTranslation();

  useSeededState(file, picked => {
    const [name, ...extensions] = picked.name.split('.');

    setCreatedAt(undefined);
    setUpdatedAt(undefined);
    setDocumentURL(undefined);
    setThumbnailURL(undefined);
    setFilename(name);
    setFileSize(picked.size);
    setExtension(`.${extensions.join('.')}`);
    setLoading(false);
  });

  useSeededState(file ? undefined : data?.document, document => {
    setCreatedAt(document.createdAt);
    setUpdatedAt(document.modifiedAt);
    setFilename(document.filename || '');
    setFileSize(document.fileSize);
    setExtension(document.extension);
    setTitle(document.title ?? '');
    setDescription(document.description ?? '');
    setDocumentURL(document.url);
    setThumbnailURL(document.thumbnailURL ?? undefined);
    setLoading(false);
  });

  useEffect(() => {
    if (!file && data && !data.document) {
      enqueueSnackbar(t('documents.panels.notFound'), {
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
        const { data } = await uploadDocument({
          variables: {
            file: file!,
            filename: filename || undefined,
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
    <DrawerForm
      onSubmit={event => {
        event.preventDefault();
        handleSave();
      }}
    >
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
          <>
            {thumbnailURL && (
              <Card>
                <CardContent>
                  <img
                    src={thumbnailURL}
                    alt={title || filename}
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
              <CardHeader title={t('documents.panels.description')} />

              <CardContent>
                <DescriptionList>
                  <DescriptionListItem label={t('documents.panels.filename')}>
                    {filename || t('documents.panels.untitled')}
                    {extension}
                  </DescriptionListItem>

                  {createdAt && (
                    <DescriptionListItem label={t('documents.panels.created')}>
                      {t('documents.panels.createdAt', {
                        createdAt: new Date(createdAt),
                      })}
                    </DescriptionListItem>
                  )}

                  {updatedAt && (
                    <DescriptionListItem label={t('documents.panels.updated')}>
                      {t('documents.panels.updatedAt', {
                        updatedAt: new Date(updatedAt),
                      })}
                    </DescriptionListItem>
                  )}

                  <DescriptionListItem label={t('documents.panels.fileSize')}>
                    {prettyBytes(fileSize)}
                  </DescriptionListItem>

                  {documentURL && (
                    <DescriptionListItem
                      label={t('documents.panels.publicLink')}
                    >
                      <a
                        href={documentURL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {documentURL}
                      </a>

                      <IconButtonTooltip
                        caption={t('documents.overview.copyLink')}
                      >
                        <IconButton
                          aria-label={t('documents.overview.copyLink')}
                          size="small"
                          style={{ marginLeft: 8 }}
                          onClick={() => {
                            navigator.clipboard.writeText(documentURL);
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={t('documents.panels.information')} />

              <CardContent>
                <Stack
                  spacing={3}
                  sx={{ width: '100%' }}
                >
                  <TextField
                    label={t('documents.panels.title')}
                    name="title"
                    value={title}
                    disabled={isDisabled}
                    onChange={event => setTitle(event.target.value)}
                    fullWidth
                  />

                  <TextField
                    label={t('documents.panels.description')}
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
  CanGetDocument.id,
  CanGetDocuments.id,
  CanDeleteDocument.id,
  CanCreateDocument.id,
])(DocumentEditPanel);
export { CheckedPermissionComponent as DocumentEditPanel };
