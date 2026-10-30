import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { FullImageFragment, ImageListDocument } from '@wepublish/editor/api';
import {
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileUpload, MdSearch } from 'react-icons/md';

import { FileDropInput } from '../atoms/fileDropInput';
import { ImageMetaData, readImageMetaData } from '../atoms/imageMetaData';
import { createCheckedPermissionComponent } from '../atoms/permissionControl';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { getImgMinSizeToCompress } from '../utility';
import { ImageEditPanel } from './imageEditPanel';

const Panel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  align-content: start;
`;

const DropZone = styled.div`
  height: 160px;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
`;

const ImageCard = styled(Card)`
  height: 100%;

  &:hover {
    border-color: ${({ theme }) => theme.vars.palette.primary.main};
  }
`;

const Action = styled(CardActionArea)`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const Thumbnail = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const Caption = styled(CardContent)`
  width: 100%;
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.25)};
`;

const LoadingRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  justify-content: center;
`;

export interface ImageSelectPanelProps {
  onClose(): void;
  onSelect(image: FullImageFragment): void;
}

const ImagesPerPage = 20;

function ImageSelectPanel({ onClose, onSelect }: ImageSelectPanelProps) {
  const [filter, setFilter] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [imageMetaData, setImageMetaData] = useState<ImageMetaData>({
    title: '',
    description: '',
    source: '',
    link: '',
    licence: '',
  });

  const {
    data,
    fetchMore,
    loading: isLoading,
  } = useQuery(ImageListDocument, {
    variables: {
      filter,
      take: ImagesPerPage,
    },
  });

  const images = data?.images.nodes ?? [];

  const { t } = useTranslation();

  async function handleDrop(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const file = files[0];

    setImageMetaData(await readImageMetaData(file));

    if (!file.type.startsWith('image')) {
      enqueueSnackbar('', {
        variant: 'error',
        title: t('articleEditor.panels.invalidImage'),
        autoHideDuration: 5000,
      });

      return;
    }

    setFile(file);
  }

  function loadMore() {
    fetchMore({
      variables: {
        take: ImagesPerPage,
        skip: 1,
        cursorId: data?.images.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        return {
          __typename: 'Query',
          images: {
            ...fetchMoreResult.images,
            nodes: [...prev.images.nodes, ...fetchMoreResult.images.nodes],
          },
        };
      },
    });
  }

  if (file) {
    return (
      <ImageEditPanel
        onClose={onClose}
        file={file}
        onSave={(image: FullImageFragment) => onSelect(image)}
        imageMetaData={imageMetaData}
      />
    );
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('articleEditor.panels.chooseImage')}</DrawerTitle>

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
        <Panel>
          <div>
            <DropZone>
              <FileDropInput
                icon={<MdFileUpload />}
                text={t('articleEditor.panels.dropImage')}
                onDrop={handleDrop}
              />
            </DropZone>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {t('images.panels.resizedImage', {
                sizeMB: getImgMinSizeToCompress(),
              })}
            </Typography>
          </div>

          <TextField
            fullWidth
            size="small"
            value={filter}
            label={t('articleEditor.panels.images')}
            onChange={event => setFilter(event.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <MdSearch />
                  </InputAdornment>
                ),
              },
            }}
          />

          {images.length ?
            <>
              <ImageGrid>
                {images.map(image => {
                  const { id, mediumURL, title, filename, extension } = image;

                  return (
                    <ImageCard
                      key={id}
                      variant="outlined"
                    >
                      <Action onClick={() => onSelect(image)}>
                        <Thumbnail
                          src={mediumURL || ''}
                          alt={title ?? ''}
                        />

                        <Caption>
                          <Typography
                            variant="subtitle2"
                            noWrap
                          >
                            {title || t('images.panels.untitled')}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {`${filename ?? ''}${extension ?? ''}`}
                          </Typography>
                        </Caption>
                      </Action>
                    </ImageCard>
                  );
                })}
              </ImageGrid>

              {data?.images.pageInfo.hasNextPage && (
                <Button
                  variant="text"
                  onClick={loadMore}
                >
                  {t('articleEditor.panels.loadMore')}
                </Button>
              )}
            </>
          : !isLoading ?
            <Alert severity="info">
              {t('articleEditor.panels.noImagesFound')}
            </Alert>
          : <LoadingRow>
              <CircularProgress size={20} />
              <span>{t('articleEditor.panels.loading')}</span>
            </LoadingRow>
          }
        </Panel>
      </DrawerBody>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetImage.id,
  CanGetImages.id,
  CanGetImages.id,
  CanDeleteImage.id,
])(ImageSelectPanel);
export { CheckedPermissionComponent as ImageSelectPanel };
