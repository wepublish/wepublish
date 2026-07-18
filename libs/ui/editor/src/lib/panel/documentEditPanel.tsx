import styled from '@emotion/styled';
import {
  DocumentListDocument,
  FullDocumentFragment,
  useDocumentQuery,
  useUpdateDocumentMutation,
  useUploadDocumentMutation,
} from '@wepublish/editor/api';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';
import {
  Button,
  Drawer,
  Form as RForm,
  IconButton,
  Message,
  Notification,
  Panel as RPanel,
  toaster,
} from 'rsuite';

import { DescriptionList, DescriptionListItem } from '../atoms/descriptionList';
import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms/permissionControl';
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

  const { data, error: loadingError } = useDocumentQuery({
    variables: { id: id! },
    skip: id === undefined,
  });

  const [updateDocument, { loading: isUpdating, error: savingError }] =
    useUpdateDocumentMutation();

  const [uploadDocument, { loading: isUploading, error: uploadError }] =
    useUploadDocumentMutation({
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
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={0}
          >
            {t('documents.panels.notFound')}
          </Message>
        );
      }
    }
  }, [file, data]);

  useEffect(() => {
    const error =
      loadingError?.message ?? savingError?.message ?? uploadError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
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

        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={2000}
          >
            {t('documents.panels.documentUpdated')}
          </Message>
        );

        if (data?.updateDocument) {
          onSave?.(data.updateDocument);
        }
      }
    } catch (err) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {t('documents.panels.uploadFailed')}
        </Message>
      );
    }
  }

  return (
    <Form onSubmit={validationPassed => validationPassed && handleSave()}>
      <Drawer.Header>
        <Drawer.Title>
          {isUpload ?
            t('documents.panels.uploadDocument')
          : t('documents.panels.editDocument')}
        </Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_DOCUMENT']}>
            <Button
              appearance={'primary'}
              disabled={isDisabled}
              type="submit"
            >
              {isUpload ? t('documents.panels.upload') : t('save')}
            </Button>
          </PermissionControl>

          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {isUpload ?
              t('documents.panels.cancel')
            : t('documents.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        {!isLoading && (
          <>
            {thumbnailURL && (
              <RPanel>
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
              </RPanel>
            )}

            <RPanel header={t('documents.panels.description')}>
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
                  <DescriptionListItem label={t('documents.panels.publicLink')}>
                    <a
                      href={documentURL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {documentURL}
                    </a>

                    <IconButton
                      icon={<MdContentCopy />}
                      size="xs"
                      appearance="subtle"
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        navigator.clipboard.writeText(documentURL);
                        toaster.push(
                          <Notification
                            type="success"
                            header={t('documents.panels.linkCopied')}
                            duration={2000}
                          />,
                          { placement: 'topEnd' }
                        );
                      }}
                    />
                  </DescriptionListItem>
                )}
              </DescriptionList>
            </RPanel>

            <RPanel header={t('documents.panels.information')}>
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
            </RPanel>
          </>
        )}
      </Drawer.Body>
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
