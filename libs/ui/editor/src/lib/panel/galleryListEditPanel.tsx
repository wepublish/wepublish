import { Button, Drawer } from '@mui/material';
import nanoid from 'nanoid';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form } from 'rsuite';

import { ChooseEditImage } from '../atoms/chooseEditImage';
import { FieldProps, ListInput, ListValue } from '../atoms/listInput';
import { Textarea } from '../atoms/textarea';
import { GalleryImageEdge } from '../blocks/types';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

export interface GalleryListEditPanelProps {
  id?: string;
  initialImages: GalleryImageEdge[];

  onSave?(images: GalleryImageEdge[]): void;
  onClose?(): void;
}

export function GalleryListEditPanel({
  id,
  initialImages,
  onSave,
  onClose,
}: GalleryListEditPanelProps) {
  const [images, setImages] = useState<ListValue<GalleryImageEdge>[]>(() =>
    initialImages.map(value => ({
      id: nanoid(),
      value,
    }))
  );

  const { t } = useTranslation();

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('blocks.imageGallery.panels.editGallery')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="contained"
            onClick={() => onSave?.(images.map(({ value }) => value))}
          >
            {t('save')}
          </Button>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('blocks.imageGallery.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <ListInput
          value={images}
          onChange={images => setImages(images)}
          defaultValue={{ image: null, caption: '' }}
        >
          {props => <GalleryListItem {...props} />}
        </ListInput>
      </DrawerBody>
    </>
  );
}

export function GalleryListItem({
  value,
  onChange,
}: FieldProps<GalleryImageEdge>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const { image, caption } = value;

  const { t } = useTranslation();

  return (
    <>
      <div>
        <ChooseEditImage
          header={''}
          image={image}
          disabled={false}
          left={5}
          top={0}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => onChange?.({ ...value, image: null })}
        />
        <Form fluid>
          <Form.Group controlId="caption">
            <Form.Label>{t('blocks.imageGallery.panels.caption')}</Form.Label>

            <Form.Control
              name="caption"
              rows={1}
              accepter={Textarea}
              value={caption}
              onChange={(caption: string) => onChange({ ...value, caption })}
            />
          </Form.Group>
        </Form>
      </div>

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
          onSelect={image => {
            setChooseModalOpen(false);
            onChange(value => ({ ...value, image }));
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
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  );
}
