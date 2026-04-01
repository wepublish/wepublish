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

    if (file.type !== 'application/pdf') {
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
            accept="application/pdf,.pdf"
            onDrop={handleDrop}
          />
        </InputWrapper>
      </Drawer.Body>
    </>
  );
}
