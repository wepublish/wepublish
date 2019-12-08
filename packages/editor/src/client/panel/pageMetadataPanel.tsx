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
  LayerContainer,
  Layer,
  IconButton,
  Image,
  TagInput
} from '@karma.run/ui'

import {
  MaterialIconClose,
  MaterialIconImageOutlined,
  MaterialIconEditOutlined,
  MaterialIconDeleteOutlined
} from '@karma.run/icons'

import {ImageReference} from '../api/types'
import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

export interface PageMetadata {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly tags: string[]
  readonly image: ImageReference | null
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

  function handleImageChange(image: ImageReference | null) {
    onChange?.({...value, image})
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Metadata"
          leftChildren={
            <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose?.()} />
          }
        />
        <PanelSection>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label="Slug"
              value={slug}
              onChange={e => onChange?.({...value, slug: e.target.value})}
            />
          </Box>

          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label="Title"
              value={title}
              onChange={e => onChange?.({...value, title: e.target.value})}
            />
          </Box>

          <Box marginBottom={Spacing.ExtraSmall}>
            <TextArea
              label="Description"
              value={description}
              onChange={e => onChange?.({...value, description: e.target.value})}
            />
          </Box>

          <Box marginBottom={Spacing.Small}>
            <TagInput
              label="Tags"
              description="Press enter to add tag"
              value={tags}
              onChange={tags => onChange?.({...value, tags: tags ?? []})}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title="Image" />
        <PanelSection dark>
          <Box height={200}>
            <Card>
              <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
                {image && (
                  <LayerContainer>
                    <Layer right={0} top={0}>
                      <IconButton
                        icon={MaterialIconImageOutlined}
                        title="Choose Image"
                        onClick={() => setChooseModalOpen(true)}
                        margin={Spacing.ExtraSmall}
                      />
                      <IconButton
                        icon={MaterialIconEditOutlined}
                        title="Edit Image"
                        onClick={() => setEditModalOpen(true)}
                        margin={Spacing.ExtraSmall}
                      />
                      <IconButton
                        icon={MaterialIconDeleteOutlined}
                        title="Remove Image"
                        onClick={() => onChange?.({...value, image: null})}
                        margin={Spacing.ExtraSmall}
                      />
                    </Layer>
                    <Image src={image.url} height={300} />
                  </LayerContainer>
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
