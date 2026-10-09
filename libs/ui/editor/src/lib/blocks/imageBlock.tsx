import styled from '@emotion/styled';
import {
  Card as MuiCard,
  CardContent,
  Drawer,
  IconButton,
} from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdBuild, MdEdit, MdPhoto } from 'react-icons/md';
import { Dropdown } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { DRAWER_WIDTHS } from '../drawer';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { ImageBlockValue } from './types';

export const Panel = styled(MuiCard)`
  display: grid;
  height: 300px;
  margin-bottom: 10px;
  overflow: hidden;
`;

export const ImagePanel = styled(MuiCard)<{ image: FullImageFragment }>`
  padding: 0;
  position: relative;
  height: 100%;
  background-size: ${({ image }) => (image?.height > 300 ? 'contain' : 'auto')};
  background-position-x: center;
  background-position-y: center;
  background-repeat: no-repeat;
  background-image: ${({ image }) =>
    image?.largeURL ?
      `url(${image?.largeURL})`
    : 'https://via.placeholder.com/240x240'};
`;

// TODO: Handle disabled prop
export function ImageBlock({
  value,
  onChange,
  autofocus,
}: BlockProps<ImageBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const { image, caption } = value;

  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus && !value.image) {
      setChooseModalOpen(true);
    }
  }, []);

  function handleImageChange(image: FullImageFragment | null) {
    onChange({ ...value, image });
  }

  return (
    <>
      <Panel>
        <CardContent>
          <CardContent>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <PlaceholderInput
                onAddClick={() => setChooseModalOpen(true)}
                addLabel={t('blocks.image.overview.chooseImage')}
              >
                {image && (
                  <ImagePanel image={image}>
                    <CardContent>
                      <CardContent>
                        <Dropdown
                          renderToggle={(
                            props: object,
                            ref: React.Ref<HTMLButtonElement>
                          ) => (
                            <IconButton
                              {...props}
                              ref={ref}
                              data-on-media
                              title={t('chooseEditImage.imageOptions')}
                              aria-label={t('chooseEditImage.imageOptions')}
                            >
                              <MdBuild />
                            </IconButton>
                          )}
                        >
                          <Dropdown.Item
                            onClick={() => setChooseModalOpen(true)}
                          >
                            <MdPhoto /> {t('blocks.image.overview.chooseImage')}
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setEditModalOpen(true)}>
                            <MdEdit /> {t('blocks.image.overview.editImage')}
                          </Dropdown.Item>
                          {/* TODO: Meta sync for metadata image */}
                        </Dropdown>
                      </CardContent>
                    </CardContent>
                  </ImagePanel>
                )}
              </PlaceholderInput>
            </CardContent>
          </CardContent>
        </CardContent>
      </Panel>
      <TypographicTextArea
        variant="subtitle2"
        align="center"
        placeholder={t('blocks.image.overview.caption')}
        value={caption}
        onChange={e => {
          onChange({ ...value, caption: e.target.value });
        }}
      />
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false);
            handleImageChange(value);
          }}
        />
      </Drawer>
      {image && (
        <Drawer
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            block={value}
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={(_, block) => {
              setEditModalOpen(false);
              block && onChange({ ...value, linkUrl: block.linkUrl });
            }}
          />
        </Drawer>
      )}
    </>
  );
}
