import React, {useState} from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  HelpBlock,
  Icon,
  Message,
  Nav,
  Panel,
  TagPicker
} from 'rsuite'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'
import {ImageRefFragment} from '../api'
import {MetaDataType} from '../blocks/types'

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
  readonly socialMediaTitle?: string
  readonly socialMediaDescription?: string
  readonly socialMediaImage?: ImageRefFragment
}

export interface PageMetadataPanelProps {
  readonly value: PageMetadata

  onClose?(): void
  onChange?(value: PageMetadata): void
}

export function PageMetadataPanel({value, onClose, onChange}: PageMetadataPanelProps) {
  const {
    title,
    description,
    slug,
    tags,
    image,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage
  } = value

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const [activeKey, setActiveKey] = useState(MetaDataType.General)

  const {t} = useTranslation()

  function handleImageChange(currentImage: ImageRefFragment) {
    switch (activeKey) {
      case MetaDataType.General: {
        const image = currentImage
        onChange?.({...value, image})
        break
      }
      case MetaDataType.SocialMedia: {
        const socialMediaImage = currentImage
        onChange?.({...value, socialMediaImage})
        break
      }
      default: {
      }
    }
  }

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <Panel>
            <Form fluid={true}>
              <FormGroup>
                <Message showIcon type="info" description={t('pageEditor.panels.metadataInfo')} />
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('pageEditor.panels.socialMediaTitle')}</ControlLabel>
                <FormControl
                  value={socialMediaTitle}
                  onChange={socialMediaTitle => {
                    onChange?.({...value, socialMediaTitle})
                  }}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('pageEditor.panels.socialMediaDescription')}</ControlLabel>
                <FormControl
                  rows={5}
                  componentClass="textarea"
                  value={socialMediaDescription}
                  onChange={socialMediaDescription => {
                    onChange?.({...value, socialMediaDescription})
                  }}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('pageEditor.panels.socialMediaImage')}</ControlLabel>
                <ChooseEditImage
                  header={''}
                  image={socialMediaImage}
                  disabled={false}
                  openChooseModalOpen={() => {
                    setChooseModalOpen(true)
                  }}
                  openEditModalOpen={() => {
                    setEditModalOpen(true)
                  }}
                  removeImage={() => onChange?.({...value, socialMediaImage: undefined})}
                />
              </FormGroup>
            </Form>
          </Panel>
        )
      case MetaDataType.General:
        return (
          <Panel>
            <Form fluid={true}>
              <FormGroup>
                <ControlLabel>{t('pageEditor.panels.slug')}</ControlLabel>
                <FormControl value={slug} onChange={slug => onChange?.({...value, slug})} />
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('pageEditor.panels.title')}</ControlLabel>
                <FormControl value={title} onChange={title => onChange?.({...value, title})} />
                <HelpBlock>{t('pageEditor.panels.titleHelpBlock')}</HelpBlock>
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('pageEditor.panels.description')}</ControlLabel>
                <FormControl
                  componentClass="textarea"
                  value={description}
                  onChange={description => onChange?.({...value, description})}
                />
                <HelpBlock>{t('pageEditor.panels.descriptionHelpBlock')}</HelpBlock>
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
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.postImage')}</ControlLabel>
                <ChooseEditImage
                  header={''}
                  image={image}
                  disabled={false}
                  openChooseModalOpen={() => {
                    setChooseModalOpen(true)
                  }}
                  openEditModalOpen={() => {
                    setEditModalOpen(true)
                  }}
                  removeImage={() => onChange?.({...value, image: undefined})}
                />
              </FormGroup>
            </Form>
          </Panel>
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
          <Nav.Item eventKey={MetaDataType.General} icon={<Icon icon="cog" />}>
            {t('articleEditor.panels.general')}
          </Nav.Item>
          <Nav.Item eventKey={MetaDataType.SocialMedia} icon={<Icon icon="share-alt" />}>
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
      {(value.image || value.socialMediaImage) && (
        <Drawer
          show={isEditModalOpen}
          size={'sm'}
          onHide={() => {
            setEditModalOpen(false)
          }}>
          <ImagedEditPanel
            id={activeKey === MetaDataType.General ? value.image?.id : value.socialMediaImage?.id}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  )
}
