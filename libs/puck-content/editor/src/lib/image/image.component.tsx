import { useQuery } from '@apollo/client/react';
import { Drawer } from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { ImageDocument } from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  ImageEditPanel,
  ImageSelectPanel,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ImageField, ImageValue } from './image.field';

const IMAGE_HEIGHT = 180;

const drawerSlotProps = {
  paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
};

export type ImageFieldRenderProps = FieldProps<
  ImageField,
  ImageValue | undefined
>;

export const ImageFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: ImageFieldRenderProps) => {
  const { t } = useTranslation();
  const [chooseOpen, setChooseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data, loading } = useQuery(ImageDocument, {
    variables: { id: value ?? '' },
    skip: !value,
  });
  const image = value ? data?.image : undefined;

  return (
    <FieldLabel
      label={field.label ?? t('', 'Image')}
      readOnly={readOnly}
      el="div"
    >
      <ChooseEditImage
        image={image}
        disabled={!!readOnly || loading}
        maxHeight={IMAGE_HEIGHT}
        openChooseModalOpen={() => setChooseOpen(true)}
        openEditModalOpen={image ? () => setEditOpen(true) : undefined}
        removeImage={() => onChange(undefined)}
        onSelect={selected => onChange(selected.id)}
      />

      <Drawer
        anchor="right"
        slotProps={drawerSlotProps}
        open={chooseOpen}
        onClose={() => setChooseOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseOpen(false)}
          onSelect={selected => {
            setChooseOpen(false);
            onChange(selected.id);
          }}
        />
      </Drawer>

      {image && (
        <Drawer
          anchor="right"
          slotProps={drawerSlotProps}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        >
          <ImageEditPanel
            id={image.id}
            onClose={() => setEditOpen(false)}
            onSave={() => setEditOpen(false)}
          />
        </Drawer>
      )}
    </FieldLabel>
  );
};
