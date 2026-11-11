import styled from '@emotion/styled';
import { Drawer, FormControl, FormHelperText, FormLabel } from '@mui/material';
import type { FullImageFragment } from '@wepublish/editor/api';
import { useField } from '@wepublish/form/core';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  ImageEditPanel,
  ImageSelectPanel,
} from '@wepublish/ui/editor';
import { useState } from 'react';

import { fieldAnatomy } from '../field-anatomy';

type ImagePanel = 'choose' | 'edit';

const ImageGroup = styled.div`
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
  }
`;

const choosePaper = { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } };

const editPaper = {
  sx: {
    display: 'flex',
    flexDirection: 'column',
    width: DRAWER_WIDTHS.sm,
    maxWidth: '100vw',
  },
};

export function ImageField() {
  const { ref, ...field } = useField<FullImageFragment | null | undefined>();
  const anatomy = fieldAnatomy(field);
  const [panel, setPanel] = useState<ImagePanel | null>(null);
  const image = field.value ?? null;
  const editable = !field.disabled && !field.readOnly;
  const labelId = `${field.id}-label`;

  const close = () => setPanel(null);

  const change = (next: FullImageFragment | null) => {
    setPanel(null);
    field.onChange(next);
    field.onBlur();
  };

  return (
    <>
      <FormControl
        error={field.invalid}
        disabled={field.disabled}
        fullWidth
      >
        {anatomy.label === undefined ? null : (
          <FormLabel
            id={labelId}
            required={false}
          >
            {anatomy.label}
          </FormLabel>
        )}

        <ImageGroup
          ref={ref}
          id={field.id}
          role="group"
          tabIndex={-1}
          aria-labelledby={
            anatomy.label === undefined || anatomy.ariaLabel !== undefined ?
              undefined
            : labelId
          }
          aria-label={anatomy.ariaLabel}
          aria-describedby={anatomy.helperTextId}
        >
          <ChooseEditImage
            image={image}
            disabled={!editable}
            openChooseModalOpen={
              editable ? () => setPanel('choose') : undefined
            }
            openEditModalOpen={
              editable && image ? () => setPanel('edit') : undefined
            }
            removeImage={editable ? () => change(null) : undefined}
            onSelect={editable ? change : undefined}
          />
        </ImageGroup>

        {anatomy.helperText === undefined ? null : (
          <FormHelperText id={anatomy.helperTextId}>
            {anatomy.helperText}
          </FormHelperText>
        )}
      </FormControl>

      <Drawer
        anchor="right"
        open={panel === 'choose'}
        onClose={close}
        slotProps={{ paper: choosePaper }}
      >
        <ImageSelectPanel
          onClose={close}
          onSelect={change}
        />
      </Drawer>

      {image ?
        <Drawer
          anchor="right"
          open={panel === 'edit'}
          onClose={close}
          slotProps={{ paper: editPaper }}
        >
          <ImageEditPanel
            id={image.id}
            onClose={close}
            onSave={change}
          />
        </Drawer>
      : null}
    </>
  );
}
