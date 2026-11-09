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

const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const supportedTypes = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-m4v',
  'video/mpeg',
];

export interface VideoUploadPanelProps {
  onClose(): void;
  onUpload(file: File): void;
}

export function VideoUploadPanel({ onClose, onUpload }: VideoUploadPanelProps) {
  const { t } = useTranslation();

  async function handleDrop(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const file = files[0];

    if (!supportedTypes.includes(file.type)) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('videos.panels.invalidVideo'),
        autoHideDuration: 5000,
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('videos.panels.fileTooLarge', {
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
        <DrawerTitle>{t('videos.panels.uploadVideo')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('videos.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <InputWrapper>
          <FileDropInput
            icon={<MdUploadFile />}
            text={t('videos.panels.dropVideo')}
            accept=".mp4,.webm,.ogv,.mov,.m4v,.mpeg,.mpg"
            onDrop={handleDrop}
          />
        </InputWrapper>
        <FormLabel>
          <br />
          {t('videos.panels.maxFileSize', { maxSize: MAX_FILE_SIZE_MB })}
        </FormLabel>
      </DrawerBody>
    </>
  );
}
