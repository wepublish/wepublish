import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
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
import { getImgMinSizeToCompress } from '../utility';

const Upload = styled.div`
  height: 100%;
  display: grid;
  align-content: center;
`;

const DropZone = styled.div`
  min-height: 280px;
  display: grid;
`;

const Content = styled.div`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const IconCircle = styled.div`
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  border-radius: 50%;
  background-color: rgba(
    ${({ theme }) => theme.vars.palette.primary.mainChannel} / 0.12
  );
  color: ${({ theme }) => theme.vars.palette.primary.main};
  font-size: 28px;
`;

const Title = styled(Typography)`
  color: ${({ theme }) => theme.vars.palette.text.primary};
`;

export interface ImageUploadPanelProps {
  onClose(): void;
  onUpload(file: File): void;
}

export function ImageUploadPanel({ onClose, onUpload }: ImageUploadPanelProps) {
  const { t } = useTranslation();

  async function handleDrop(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const file = files[0];

    if (!file.type.startsWith('image')) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('articleEditor.panels.invalidImage'),
        autoHideDuration: 5000,
      });

      return;
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
        <Upload>
          <DropZone>
            <FileDropInput onDrop={handleDrop}>
              <Content>
                <IconCircle>
                  <MdUploadFile />
                </IconCircle>

                <Title variant="subtitle1">
                  {t('articleEditor.panels.dropImage')}
                </Title>

                <Button variant="outlined">
                  {t('articleEditor.panels.chooseFile')}
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {t('images.panels.resizedImage', {
                    sizeMB: getImgMinSizeToCompress(),
                  })}
                </Typography>
              </Content>
            </FileDropInput>
          </DropZone>
        </Upload>
      </DrawerBody>
    </>
  );
}
