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
import { getImgMinSizeToCompress } from '../utility';

const InputWrapper = styled.div`
  height: 100px;
`;

export interface ImageUploadPanelProps {
  onClose(): void;
  onUpload(file: File): void;
}

export function ImageUploadPanel({ onClose, onUpload }: ImageUploadPanelProps) {
  const { t } = useTranslation();
  async function handleDrop(files: File[]) {
    if (files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('image')) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('articleEditor.panels.invalidImage'),
        autoHideDuration: 5000,
      });
    }

    onUpload(file);
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('articleEditor.panels.uploadImage')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('articleEditor.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <InputWrapper>
          <FileDropInput
            icon={<MdUploadFile />}
            text={t('articleEditor.panels.dropImage')}
            onDrop={handleDrop}
          />
        </InputWrapper>
        <Form.Label>
          <br />
          {t('images.panels.resizedImage', {
            sizeMB: getImgMinSizeToCompress(),
          })}
        </Form.Label>
      </DrawerBody>
    </>
  );
}
