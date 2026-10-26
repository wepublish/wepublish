import styled from '@emotion/styled';
import { Drawer } from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../atoms/blockList';
import { ChooseEditImage } from '../atoms/chooseEditImage';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { DRAWER_WIDTHS } from '../drawer';
import { ImageEditPanel } from '../panel/imageEditPanel';
import { ImageSelectPanel } from '../panel/imageSelectPanel';
import { ImageBlockValue } from './types';

const BLOCK_IMAGE_HEIGHT = 300;

const Wrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export function ImageBlock({
  value,
  onChange,
  autofocus,
  disabled,
}: BlockProps<ImageBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(
    () => Boolean(autofocus) && !value.image
  );
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const { image, caption } = value;

  const { t } = useTranslation();

  function handleImageChange(image: FullImageFragment | null) {
    onChange({ ...value, image });
  }

  return (
    <Wrapper>
      <ChooseEditImage
        onSelect={value => {
          setChooseModalOpen(false);
          handleImageChange(value);
        }}
        image={image}
        disabled={!!disabled}
        maxHeight={BLOCK_IMAGE_HEIGHT}
        openChooseModalOpen={() => setChooseModalOpen(true)}
        openEditModalOpen={() => setEditModalOpen(true)}
        removeImage={() => handleImageChange(null)}
      />

      <TypographicTextArea
        variant="subtitle2"
        align="center"
        placeholder={t('blocks.image.overview.caption')}
        value={caption}
        disabled={disabled}
        onChange={e => {
          onChange({ ...value, caption: e.target.value });
        }}
      />
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
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

              if (block) {
                onChange({ ...value, linkUrl: block.linkUrl });
              }
            }}
          />
        </Drawer>
      )}
    </Wrapper>
  );
}
