import styled from '@emotion/styled';
import { Button, FormLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdUploadFile } from 'react-icons/md';

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

const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const supportedTypes = [
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/aac',
  'audio/mp4',
  'audio/flac',
];

export interface AudioUploadPanelProps {
  onClose(): void;
  onUpload(file: File): void;
}

export function AudioUploadPanel({ onClose, onUpload }: AudioUploadPanelProps) {
  const { t } = useTranslation();

  async function handleDrop(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const file = files[0];

    if (!supportedTypes.includes(file.type)) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('audio.panels.invalidAudio'),
        autoHideDuration: 5000,
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('audio.panels.fileTooLarge', {
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
        <DrawerTitle>{t('audio.panels.uploadAudio')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('audio.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <InputWrapper>
          <FileDropInput
            icon={<MdUploadFile />}
            text={t('audio.panels.dropAudio')}
            accept=".mp3,.ogg,.oga,.wav,.weba,.aac,.m4a,.flac"
            onDrop={handleDrop}
          />
        </InputWrapper>
        <FormLabel>
          <br />
          {t('audio.panels.maxFileSize', { maxSize: MAX_FILE_SIZE_MB })}
        </FormLabel>
      </DrawerBody>
    </>
  );
}
