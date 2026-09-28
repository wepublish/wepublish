import type { CustomField } from '@measured/puck';
import type { FullImageFragment } from '@wepublish/editor/api';
import { ImageSelectPanel } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'rsuite';
import type { ImageFieldValue } from './convert';
import { EMPTY_IMAGE } from './convert';
import { lookupImageUrl, rememberImages } from './images';
import { ImagePreview, Note, SmallButton, SmallInput, Toolbar } from './styles';

/**
 * Picks an image from the CMS media library (stored as its id, so the mail
 * renders the media server's JPEG variant), or takes an external URL.
 */
function ImagePicker({
  value,
  onChange,
  id,
}: {
  value: ImageFieldValue;
  onChange: (next: ImageFieldValue) => void;
  id: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const preview = value.imageId ? lookupImageUrl(value.imageId) : value.src;

  const select = (image: FullImageFragment) => {
    // The picker's own variant is good enough for the canvas; the mail asks
    // the server for the JPEG. Wide enough for the widest image block.
    rememberImages([{ id: image.id, url: image.largeURL ?? image.url ?? '' }]);
    onChange({ imageId: image.id });
    setOpen(false);
  };

  return (
    <div>
      {value.imageId ?
        <Note>{t('newsletter.image.cmsImage', { id: value.imageId })}</Note>
      : <SmallInput
          id={id}
          type="text"
          style={{ display: 'block', width: '100%' }}
          value={value.src ?? ''}
          placeholder="https://…"
          onChange={event => onChange({ src: event.currentTarget.value })}
        />
      }

      <Toolbar style={{ marginTop: 4 }}>
        <SmallButton
          type="button"
          onClick={() => setOpen(true)}
        >
          {t('newsletter.image.chooseFromLibrary')}
        </SmallButton>
        {value.imageId || value.src ?
          <SmallButton
            type="button"
            onClick={() => onChange(EMPTY_IMAGE)}
          >
            {t('newsletter.image.remove')}
          </SmallButton>
        : null}
      </Toolbar>

      {preview ?
        <ImagePreview
          src={preview}
          alt=""
        />
      : null}

      <Drawer
        open={open}
        size="sm"
        onClose={() => setOpen(false)}
      >
        {open ?
          <ImageSelectPanel
            onClose={() => setOpen(false)}
            onSelect={select}
          />
        : null}
      </Drawer>
    </div>
  );
}

export function imageField(label: string): CustomField<ImageFieldValue> {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, id }) => (
      <ImagePicker
        value={value ?? EMPTY_IMAGE}
        onChange={onChange}
        id={id}
      />
    ),
  };
}
