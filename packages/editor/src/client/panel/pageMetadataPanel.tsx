import React, {useState} from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Icon,
  Nav,
  Panel,
  TagPicker
} from 'rsuite'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'
import {ImageRefFragment} from '../api'
import {MetatagType} from '../blocks/types'

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

  // TODO: Include this later into value
  const [socialMediaTitle, setSocialMediaTitle] = useState('')
  const [socialMediaDescription, setSocialMediaDescription] = useState('')
  const [socialMediaAuthor, setSocialMediaAuthor] = useState('')
  const [activeKey, setActiveKey] = useState(MetatagType.General)

  const {t} = useTranslation()

  function handleImageChange(image: ImageRefFragment) {
    onChange?.({...value, image})
  }

  function currentContent() {
    switch (activeKey) {
      case MetatagType.SocialMedia:
        return (
          <>
            <Form fluid={true}>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.socialMediaTitle')}</ControlLabel>
                <FormControl
                  value={socialMediaTitle}
                  onChange={socialMediaTitle => {
                    setSocialMediaTitle(socialMediaTitle)
                  }}
                />
                <ControlLabel>{t('articleEditor.panels.socialMediaDescription')}</ControlLabel>
                <FormControl
                  rows={5}
                  componentClass="textarea"
                  value={socialMediaDescription}
                  onChange={socialMediaDescription => {
                    setSocialMediaDescription(socialMediaDescription)
                  }}
                />
                <ControlLabel>{t('articleEditor.panels.socialMediaAuthor')}</ControlLabel>
                <FormControl
                  value={socialMediaAuthor}
                  onChange={socialMediaAuthor => {
                    setSocialMediaAuthor(socialMediaAuthor)
                  }}
                />
              </FormGroup>
            </Form>
          </>
        )
      case MetatagType.General:
        return (
          <>
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
          </>
        )
      default:
        return <></>
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('pageEditor.panels.metadata')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={activeKey}
          onSelect={activeKey => setActiveKey(activeKey)}
          style={{marginBottom: 20}}>
          <Nav.Item eventKey={MetatagType.General} icon={<Icon icon="cog" />}>
            {t('articleEditor.panels.general')}
          </Nav.Item>
          <Nav.Item eventKey={MetatagType.SocialMedia} icon={<Icon icon="share-alt" />}>
            {t('articleEditor.panels.socialMedia')}
          </Nav.Item>
        </Nav>

        {currentContent()}
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
