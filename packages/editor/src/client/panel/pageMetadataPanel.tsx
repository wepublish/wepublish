import React, {useState} from 'react'

import {Button, ControlLabel, Drawer, Form, FormControl, FormGroup, Panel, TagPicker} from 'rsuite'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'
import {ImageRefFragment} from '../api'

import {useTranslation} from 'react-i18next'
import {ChooseEditImage} from '../atoms/chooseEditImage'
export interface PageMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface PageMetadata {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly tags: string[]
  readonly properties: PageMetadataProperty[]
  readonly image?: ImageRefFragment
}

export interface PageMetadataPanelProps {
  readonly value: PageMetadata

  onClose?(): void
  onChange?(value: PageMetadata): void
}

export function PageMetadataPanel({value, onClose, onChange}: PageMetadataPanelProps) {
  const {title, description, slug, tags, image} = value

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {t} = useTranslation()

  function handleImageChange(image: ImageRefFragment) {
    onChange?.({...value, image})
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('pageEditor.panels.metadata')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('pageEditor.panels.slug')}</ControlLabel>
              <FormControl value={slug} onChange={slug => onChange?.({...value, slug})} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('pageEditor.panels.title')}</ControlLabel>
              <FormControl value={title} onChange={title => onChange?.({...value, title})} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('pageEditor.panels.description')}</ControlLabel>
              <FormControl
                componentClass="textarea"
                value={description}
                onChange={description => onChange?.({...value, description})}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('pageEditor.panels.tags')}</ControlLabel>
              <TagPicker
                style={{width: '100%'}}
                creatable={true}
                value={tags}
                data={tags.map(tag => ({label: tag, value: tag}))}
                onChange={tagsValue => onChange?.({...value, tags: tagsValue ?? []})}
              />
            </FormGroup>
          </Form>
        </Panel>
        <ChooseEditImage
          image={image}
          disabled={false}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => onChange?.({...value, image: undefined})}
        />
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('pageEditor.panels.close')}
        </Button>
      </Drawer.Footer>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {value.image && (
        <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
          <ImagedEditPanel id={value.image!.id} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
    </>
  )
}
