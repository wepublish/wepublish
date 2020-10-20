import React, {useState} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  TextArea,
  PlaceholderInput,
  PanelSectionHeader,
  Card,
  Drawer,
  IconButton,
  Image,
  TagInput,
  ZIndex
} from '@karma.run/ui'

import {
  MaterialIconClose,
  MaterialIconImageOutlined,
  MaterialIconEditOutlined
} from '@karma.run/icons'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'
import {ImageRefFragment} from '../api'

import {useTranslation} from 'react-i18next'
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
      <Panel>
        <PanelHeader
          title={t('pageEditor.panels.metadata')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('pageEditor.panels.close')}
              onClick={() => onClose?.()}
            />
          }
        />
        <PanelSection>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label={t('pageEditor.panels.slug')}
              value={slug}
              onChange={e => onChange?.({...value, slug: e.target.value})}
            />
          </Box>

          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label={t('pageEditor.panels.title')}
              value={title}
              onChange={e => onChange?.({...value, title: e.target.value})}
            />
          </Box>

          <Box marginBottom={Spacing.ExtraSmall}>
            <TextArea
              label={t('pageEditor.panels.description')}
              value={description}
              onChange={e => onChange?.({...value, description: e.target.value})}
            />
          </Box>

          <Box marginBottom={Spacing.Small}>
            <TagInput
              label={t('pageEditor.panels.tags')}
              description={t('pageEditor.panels.addTag')}
              value={tags}
              onChange={tags => onChange?.({...value, tags: tags ?? []})}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title={t('pageEditor.panels.image')} />
        <PanelSection dark>
          <Box height={200}>
            <Card>
              <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
                {image && (
                  <Box position="relative" width="100%" height="100%">
                    <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                      <IconButton
                        icon={MaterialIconImageOutlined}
                        title={t('pageEditor.panels.chooseImage')}
                        onClick={() => setChooseModalOpen(true)}
                        margin={Spacing.ExtraSmall}
                      />
                      <IconButton
                        icon={MaterialIconEditOutlined}
                        title={t('pageEditor.panels.editImage')}
                        onClick={() => setEditModalOpen(true)}
                        margin={Spacing.ExtraSmall}
                      />
                      <IconButton
                        icon={MaterialIconClose}
                        title={t('pageEditor.panels.removeImage')}
                        onClick={() => onChange?.({...value, image: undefined})}
                        margin={Spacing.ExtraSmall}
                      />
                    </Box>
                    {image.url && <Image src={image.url} width="100%" height="100%" />}
                  </Box>
                )}
              </PlaceholderInput>
            </Card>
          </Box>
        </PanelSection>
      </Panel>
      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={value => {
              setChooseModalOpen(false)
              handleImageChange(value)
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => <ImagedEditPanel id={value.image!.id} onClose={() => setEditModalOpen(false)} />}
      </Drawer>
    </>
  )
}
