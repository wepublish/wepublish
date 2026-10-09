import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
} from '@mui/material';
import {
  DocumentDocument,
  DocumentListDocument,
  FullDocumentFragment,
  UpdateDocumentDocument,
  UploadDocumentDocument,
} from '@wepublish/editor/api';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';
import { Form as RForm } from 'rsuite';

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
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { getOperationNameFromDocument } from '../utility';

const { Label, Control, Group } = RForm;

const Form = styled(RForm)`
  height: 100%;
`;

export interface DocumentEditPanelProps {
  readonly id?: string;
  readonly file?: File;

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
  const isAuthorized = useAuthorisation('CAN_CREATE_DOCUMENT');
  const isDisabled = isLoading || isUpdating || isUploading || !isAuthorized;
  const isUpload = file !== undefined;
  const { t } = useTranslation();

  useEffect(() => {
    if (file) {
      const [name, ...extensions] = file.name.split('.');
      const ext = `.${extensions.join('.')}`;

      setCreatedAt(undefined);
      setUpdatedAt(undefined);
      setDocumentURL(undefined);
      setThumbnailURL(undefined);
      setFilename(name);
      setFileSize(file.size);
      setExtension(ext);
      setLoading(false);
    } else if (data) {
      const { document } = data;

      if (document) {
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
      } else {
        enqueueSnackbar(t('documents.panels.notFound'), {
          variant: 'error',
          autoHideDuration: null,
        });
      }
    }
  }, [file, data]);

  useEffect(() => {
    const error =
      loadingError?.message ?? savingError?.message ?? uploadError?.message;
    if (error)
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
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
    <Form onSubmit={validationPassed => validationPassed && handleSave()}>
      <DrawerHeader>
        <DrawerTitle>
          {isUpload ?
            t('documents.panels.uploadDocument')
          : t('documents.panels.editDocument')}
        </DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_DOCUMENT']}>
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
              <Card variant="outlined">
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

            <Card variant="outlined">
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

            <Card variant="outlined">
              <CardHeader title={t('documents.panels.information')} />

              <CardContent>
                <RForm.Stack fluid>
                  <Group controlId="documentTitle">
                    <Label>{t('documents.panels.title')}</Label>
                    <Control
                      name="title"
                      value={title}
                      disabled={isDisabled}
                      onChange={(value: string) => setTitle(value)}
                    />
                  </Group>

                  <Group controlId="documentDescription">
                    <Label>{t('documents.panels.description')}</Label>
                    <Control
                      name="description"
                      value={description}
                      disabled={isDisabled}
                      onChange={(value: string) => setDescription(value)}
                    />
                  </Group>
                </RForm.Stack>
              </CardContent>
            </Card>
          </>
        )}
      </DrawerBody>
    </Form>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_DOCUMENT',
  'CAN_GET_DOCUMENTS',
  'CAN_DELETE_DOCUMENT',
  'CAN_CREATE_DOCUMENT',
])(DocumentEditPanel);
export { CheckedPermissionComponent as DocumentEditPanel };
