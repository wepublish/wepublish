import styled from '@emotion/styled';
import { FullImageFragment, useImageListQuery } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileUpload, MdSearch } from 'react-icons/md';
import {
  Button,
  Drawer,
  FlexboxGrid,
  Form,
  Input,
  InputGroup,
  Loader,
  Message,
  Notification,
  Panel as RPanel,
  toaster,
} from 'rsuite';

import { FileDropInput } from '../atoms/fileDropInput';
import { ImageMetaData, readImageMetaData } from '../atoms/imageMetaData';
import { createCheckedPermissionComponent } from '../atoms/permissionControl';
import { Typography } from '../atoms/typography';
import { getImgMinSizeToCompress } from '../utility';
import { ImageEditPanel } from './imageEditPanel';

const ImgWrapper = styled.div`
  background-color: #f7f7fa;
`;

const Panel = styled(RPanel)`
  cursor: pointer;
`;

const Img = styled.img`
  display: block;
  margin: 0 auto;
  max-width: 240px;
  max-height: 240px;
  width: 100%;
`;

const FileDropWrapper = styled(RPanel)`
  height: 150px;
`;

const FlexItem = styled(FlexboxGrid.Item)`
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
  } = useImageListQuery({
    fetchPolicy: 'network-only',
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
      toaster.push(
        <Notification
          type="error"
          header={t('articleEditor.panels.invalidImage')}
          duration={5000}
        />,
        { placement: 'topEnd' }
      );

      return;
    }

    setFile(file);
  }

  function loadMore() {
    fetchMore({
      variables: {
        take: ImagesPerPage,
        skip: 1,
        cursor: data?.images.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
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
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.chooseImage')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('articleEditor.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <FileDropWrapper bodyFill>
          <FileDropInput
            icon={<MdFileUpload />}
            text={t('articleEditor.panels.dropImage')}
            onDrop={handleDrop}
          />
        </FileDropWrapper>
        <Form.ControlLabel>
          <br />
          {t('images.panels.resizedImage', {
            sizeMB: getImgMinSizeToCompress(),
          })}
        </Form.ControlLabel>

        <RPanel header={t('articleEditor.panels.images')}>
          <InputGroup>
            <Input
              value={filter}
              onChange={value => setFilter(value)}
            />
            <InputGroup.Addon>
              <MdSearch />
            </InputGroup.Addon>
          </InputGroup>
        </RPanel>
        {images.length ?
          <>
            <FlexboxGrid justify="space-around">
              {images.map(image => {
                const { id, mediumURL, title, filename, extension } = image;
                return (
                  <FlexItem
                    key={id}
                    colspan={10}
                  >
                    <Panel
                      onClick={() => onSelect(image)}
                      shaded
                      bordered
                      bodyFill
                    >
                      <ImgWrapper>
                        <Img src={mediumURL || ''} />
                      </ImgWrapper>
                      <RPanel>
                        <Typography
                          variant={'subtitle1'}
                          ellipsize
                        >{`${
                          filename || t('images.panels.untitled')
                        }${extension}`}</Typography>
                        <Typography variant={'body2'}>
                          {title || t('images.panels.Untitled')}
                        </Typography>
                      </RPanel>
                    </Panel>
                  </FlexItem>
                );
              })}
            </FlexboxGrid>
            {data?.images.pageInfo.hasNextPage && (
              <Button onClick={loadMore}>
                {t('articleEditor.panels.loadMore')}
              </Button>
            )}
          </>
        : !isLoading ?
          <Message type="info">
            {t('articleEditor.panels.noImagesFound')}
          </Message>
        : <Loader
            center
            content={t('articleEditor.panels.loading')}
          />
        }
      </Drawer.Body>
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
