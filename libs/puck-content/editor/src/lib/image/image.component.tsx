import { useQuery } from '@apollo/client/react';
import { Drawer } from '@mui/material';
import { Button, FieldLabel, FieldProps } from '@puckeditor/core';
import { ImageDocument } from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  ImageEditPanel,
  ImageSelectPanel,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';

import { FieldStack } from '../field-controls';
import { ImageField, ImageValue } from './image.field';

const IMAGE_HEIGHT = 180;

const drawerSlotProps = {
  paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
};

const ImageSelectDrawer = ({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}) => (
  <Drawer
    anchor="right"
    slotProps={drawerSlotProps}
    open={open}
    onClose={onClose}
  >
    <ImageSelectPanel
      onClose={onClose}
      onSelect={selected => {
        onClose();
        onSelect(selected.id);
      }}
    />
  </Drawer>
);

export type ImagePickerProps = {
  value: ImageValue | undefined;
  onChange: (value: ImageValue | undefined) => void;
  readOnly?: boolean;
};

export const ImagePicker = ({
  value,
  onChange,
  readOnly,
}: ImagePickerProps) => {
  const [chooseOpen, setChooseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data, loading } = useQuery(ImageDocument, {
    variables: { id: value ?? '' },
    skip: !value,
  });
  const image = value ? data?.image : undefined;

  return (
    <>
      <ChooseEditImage
        image={image}
        disabled={!!readOnly || loading}
        maxHeight={IMAGE_HEIGHT}
        openChooseModalOpen={() => setChooseOpen(true)}
        openEditModalOpen={image ? () => setEditOpen(true) : undefined}
        removeImage={() => onChange(undefined)}
        onSelect={selected => onChange(selected.id)}
      />

      <ImageSelectDrawer
        open={chooseOpen}
        onClose={() => setChooseOpen(false)}
        onSelect={onChange}
      />

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
    </>
  );
};

export type ImagePickerListProps = {
  value: ImageValue[];
  onChange: (value: ImageValue[]) => void;
  readOnly?: boolean;
};

export const ImagePickerList = ({
  value,
  onChange,
  readOnly,
}: ImagePickerListProps) => {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <FieldStack>
      {value.map((id, index) => (
        <ImagePicker
          key={`${index}-${id}`}
          value={id}
          readOnly={readOnly}
          onChange={next =>
            onChange(
              next ?
                value.map((current, i) => (i === index ? next : current))
              : value.filter((_, i) => i !== index)
            )
          }
        />
      ))}

      <Button
        variant="secondary"
        icon={<MdAdd />}
        disabled={readOnly}
        fullWidth
        onClick={() => setAddOpen(true)}
      >
        {t('', 'Add image')}
      </Button>

      <ImageSelectDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSelect={id => onChange([...value, id])}
      />
    </FieldStack>
  );
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

  return (
    <FieldLabel
      label={field.label ?? t('', 'Image')}
      readOnly={readOnly}
      el="div"
    >
      <ImagePicker
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      />
    </FieldLabel>
  );
};
