import { Drawer } from '@mui/material';
import type { CustomField } from '@puckeditor/core';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  ImageSelectPanel,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { lookupImage, rememberImages } from './images';

/**
 * Image field: pick from the media library. The value stored is the image id
 * alone; the mail asks the media server for a format every client can read when
 * it is rendered, the canvas reads the picture from the image cache.
 */
function MediaPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const [choosing, setChoosing] = useState(false);

  return (
    <div
      role="group"
      aria-label={label}
    >
      <ChooseEditImage
        image={lookupImage(value)}
        disabled={false}
        maxHeight={160}
        openChooseModalOpen={() => setChoosing(true)}
        removeImage={value ? () => onChange('') : undefined}
      />

      <Drawer
        anchor="right"
        slotProps={{
          paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
        }}
        open={choosing}
        onClose={() => setChoosing(false)}
      >
        <ImageSelectPanel
          onClose={() => setChoosing(false)}
          onSelect={image => {
            rememberImages([image]);
            setChoosing(false);
            onChange(image.id);
          }}
        />
      </Drawer>
    </div>
  );
}

export function mediaField(label: string): CustomField<string> {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange }) => (
      <MediaPicker
        value={value ?? ''}
        onChange={onChange}
        label={label}
      />
    ),
  };
}
