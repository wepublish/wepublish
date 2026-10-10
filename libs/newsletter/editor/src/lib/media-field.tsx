import type { CustomField } from '@puckeditor/core';
import { ChooseEditImage, ImageSelectPanel } from '@wepublish/ui/editor';
import { useState } from 'react';
import { Drawer } from 'rsuite';
import { lookupImage, rememberImages } from './images';

/**
 * Image field: pick from the media library. The value stored is the image id
 * alone; the mail asks the media server for a format every client can read when
 * it is rendered, the canvas reads the picture from the image cache.
 */
function MediaPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [choosing, setChoosing] = useState(false);

  return (
    <>
      <ChooseEditImage
        image={lookupImage(value)}
        disabled={false}
        maxHeight={160}
        openChooseModalOpen={() => setChoosing(true)}
        removeImage={value ? () => onChange('') : undefined}
      />

      <Drawer
        open={choosing}
        size="sm"
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
    </>
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
      />
    ),
  };
}
