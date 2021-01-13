import React, {useState} from 'react'
import nanoid from 'nanoid'

import {Button, Drawer, Form, FormGroup, ControlLabel, FormControl} from 'rsuite'

import {ListInput, ListValue, FieldProps} from '../atoms/listInput'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

import {GalleryImageEdge} from '../blocks/types'

import {useTranslation} from 'react-i18next'
import {ChooseEditImage} from '../atoms/chooseEditImage'

export interface GalleryListEditPanelProps {
  id?: string
  initialImages: GalleryImageEdge[]

  onSave?(images: GalleryImageEdge[]): void
  onClose?(): void
}

export function GalleryListEditPanel({
  id,
  initialImages,
  onSave,
  onClose
}: GalleryListEditPanelProps) {
  const [images, setImages] = useState<ListValue<GalleryImageEdge>[]>(() =>
    initialImages.map(value => ({
      id: nanoid(),
      value
    }))
  )

  const {t} = useTranslation()

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.imageGallery.panels.editGallery')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <ListInput
          value={images}
          onChange={images => setImages(images)}
          defaultValue={{image: null, caption: ''}}>
          {props => <GalleryListItem {...props} />}
        </ListInput>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} onClick={() => onSave?.(images.map(({value}) => value))}>
          {t('blocks.imageGallery.panels.save')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('blocks.imageGallery.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}

export function GalleryListItem({value, onChange}: FieldProps<GalleryImageEdge>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {image, caption} = value

  const {t} = useTranslation()

  return (
    <>
      <div>
        <ChooseEditImage
          header={''}
          image={image}
          disabled={false}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => onChange?.({...value, image: null})}
        />
        <Form fluid={true}>
          <FormGroup>
            <ControlLabel>{t('blocks.imageGallery.panels.caption')}</ControlLabel>
            <FormControl
              rows={1}
              componentClass="textarea"
              value={caption}
              onChange={caption => onChange({...value, caption})}
            />
          </FormGroup>
        </Form>
      </div>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false)
            onChange(value => ({...value, image}))
          }}
        />
      </Drawer>
      {image && (
        <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
          <ImagedEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  )
}
