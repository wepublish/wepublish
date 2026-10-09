import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Box,
  Button,
  Card,
  Card as MuiCard,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Grid as MuiGrid,
} from '@mui/material';
import { FullImageFragment, ImageListDocument } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileUpload, MdSearch } from 'react-icons/md';
import { Form, Input, InputGroup } from 'rsuite';

import { FileDropInput } from '../atoms/fileDropInput';
import { ImageMetaData, readImageMetaData } from '../atoms/imageMetaData';
import { createCheckedPermissionComponent } from '../atoms/permissionControl';
import { Typography } from '../atoms/typography';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { getImgMinSizeToCompress } from '../utility';
import { ImageEditPanel } from './imageEditPanel';

const ImgWrapper = styled.div`
  background-color: var(--rs-bg-well);
`;

const Panel = styled(MuiCard)`
  cursor: pointer;
`;

const Img = styled.img`
  display: block;
  margin: 0 auto;
  max-width: 240px;
  max-height: 240px;
  width: 100%;
`;

const FileDropWrapper = styled(MuiCard)`
  height: 150px;
`;

const FlexItem = styled(MuiGrid)`
  margin-bottom: 20px;
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
    if (files.length === 0) return;

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
        if (!fetchMoreResult) return prev;

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
        <FileDropWrapper>
          <CardContent>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <FileDropInput
                icon={<MdFileUpload />}
                text={t('articleEditor.panels.dropImage')}
                onDrop={handleDrop}
              />
            </CardContent>
          </CardContent>
        </FileDropWrapper>
        <Form.Label>
          <br />
          {t('images.panels.resizedImage', {
            sizeMB: getImgMinSizeToCompress(),
          })}
        </Form.Label>

        <Card variant="outlined">
          <CardHeader title={t('articleEditor.panels.images')} />

          <CardContent>
            <InputGroup>
              <Input
                value={filter}
                onChange={value => setFilter(value)}
              />
              <InputGroup.Addon>
                <MdSearch />
              </InputGroup.Addon>
            </InputGroup>
          </CardContent>
        </Card>
        {images.length ?
          <>
            <Grid
              container
              spacing={2}
              sx={{ justifyContent: 'space-around' }}
            >
              {images.map(image => {
                const { id, mediumURL, title, filename, extension } = image;
                return (
                  <FlexItem
                    size={{ xs: 5 }}
                    key={id}
                  >
                    <Panel onClick={() => onSelect(image)}>
                      <CardContent>
                        <CardContent>
                          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <ImgWrapper>
                              <Img src={mediumURL || ''} />
                            </ImgWrapper>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography
                                  variant={'subtitle1'}
                                  ellipsize
                                >{`${
                                  filename || t('images.panels.untitled')
                                }${extension}`}</Typography>
                                <Typography variant={'body2'}>
                                  {title || t('images.panels.Untitled')}
                                </Typography>
                              </CardContent>
                            </Card>
                          </CardContent>
                        </CardContent>
                      </CardContent>
                    </Panel>
                  </FlexItem>
                );
              })}
            </Grid>
            {data?.images.pageInfo.hasNextPage && (
              <Button
                variant="outlined"
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
        : <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress />
            <span>{t('articleEditor.panels.loading')}</span>
          </Box>
        }
      </DrawerBody>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_IMAGE',
  'CAN_GET_IMAGES',
  'CAN_GET_IMAGES',
  'CAN_DELETE_IMAGE',
])(ImageSelectPanel);
export { CheckedPermissionComponent as ImageSelectPanel };
