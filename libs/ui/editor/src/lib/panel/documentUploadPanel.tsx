import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { MdUploadFile } from 'react-icons/md';
import { Button, Drawer, Notification, toaster } from 'rsuite';

import { FileDropInput } from '../atoms';

const InputWrapper = styled.div`
  height: 100px;
`;

export interface DocumentUploadPanelProps {
  onClose(): void;
  onUpload(file: File): void;
}

export function DocumentUploadPanel({
  onClose,
  onUpload,
}: DocumentUploadPanelProps) {
  const { t } = useTranslation();

  async function handleDrop(files: File[]) {
    if (files.length === 0) return;

    const file = files[0];

    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      'text/csv',
      'text/plain',
      'application/zip',
    ];

    if (!supportedTypes.includes(file.type)) {
      toaster.push(
        <Notification
          type="error"
          header={t('documents.panels.invalidDocument')}
          duration={5000}
        />,
        { placement: 'topEnd' }
      );
      return;
    }

    onUpload(file);
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('documents.panels.uploadDocument')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('documents.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <InputWrapper>
          <FileDropInput
            icon={<MdUploadFile />}
            text={t('documents.panels.dropDocument')}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.csv,.txt,.zip"
            onDrop={handleDrop}
          />
        </InputWrapper>
      </Drawer.Body>
    </>
  );
}
