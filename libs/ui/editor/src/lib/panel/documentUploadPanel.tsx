import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdUploadFile } from 'react-icons/md';
import { Form } from 'rsuite';

import { FileDropInput } from '../atoms';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';

const InputWrapper = styled.div`
  height: 100px;
`;

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  'application/json',
  'application/xml',
  'text/xml',
  'application/zip',
];

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

    if (!supportedTypes.includes(file.type)) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('documents.panels.invalidDocument'),
        autoHideDuration: 5000,
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('documents.panels.fileTooLarge', {
          maxSize: MAX_FILE_SIZE_MB,
        }),
        autoHideDuration: 5000,
      });
      return;
    }

    onUpload(file);
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('documents.panels.uploadDocument')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('documents.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <InputWrapper>
          <FileDropInput
            icon={<MdUploadFile />}
            text={t('documents.panels.dropDocument')}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.csv,.txt,.json,.xml,.zip"
            onDrop={handleDrop}
          />
        </InputWrapper>
        <Form.Label>
          <br />
          {t('documents.panels.maxFileSize', { maxSize: MAX_FILE_SIZE_MB })}
        </Form.Label>
      </DrawerBody>
    </>
  );
}
