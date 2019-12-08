import React, {useState} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  Toggle,
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
import {slugify} from '../utility'

export interface ArticleMetadata {
  readonly slug: string
  readonly preTitle: string
  readonly title: string
  readonly lead: string
  readonly authors: string[]
  readonly tags: string[]
  readonly image: ImageReference | null
  readonly shared: boolean
  readonly breaking: boolean
}

export interface ArticleMetadataPanelProps {
  readonly value: ArticleMetadata

  onClose?(): void
  onChange?(value: ArticleMetadata): void
}

export function ArticleMetadataPanel({value, onClose, onChange}: ArticleMetadataPanelProps) {
  const {preTitle, title, lead, tags, shared, breaking, image} = value

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
              label="Pre-title"
              value={preTitle}
              onChange={e => onChange?.({...value, preTitle: e.target.value})}
            />
          </Box>

          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label="Title"
              value={title}
              onChange={e =>
                onChange?.({...value, title: e.target.value, slug: slugify(e.target.value)})
              }
            />
          </Box>

          <Box marginBottom={Spacing.ExtraSmall}>
            <TextArea
              label="Lead"
              value={lead}
              onChange={e => onChange?.({...value, lead: e.target.value})}
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

          <Box>
            <Toggle
              label="Breaking News"
              checked={breaking}
              onChange={e => onChange?.({...value, breaking: e.target.checked})}
            />
          </Box>

          {/* TODO: Authors */}
        </PanelSection>
        <PanelSectionHeader title="Image" />
        <PanelSection dark>
          <Box height={200}>
            <Card>
              <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
                {image && (
                  <LayerContainer>
                    <Layer right={0} top={0}>
                      <Box
                        margin={Spacing.ExtraSmall}
                        flexDirection="row"
                        justifyContent="flex-end"
                        display="flex">
                        <IconButton
                          icon={MaterialIconImageOutlined}
                          title="Choose Image"
                          onClick={() => setChooseModalOpen(true)}
                        />
                      </Box>
                      <Box
                        margin={Spacing.ExtraSmall}
                        flexDirection="row"
                        justifyContent="flex-end"
                        display="flex">
                        <IconButton
                          icon={MaterialIconEditOutlined}
                          title="Edit Image"
                          onClick={() => setEditModalOpen(true)}
                        />
                      </Box>
                      <Box
                        margin={Spacing.ExtraSmall}
                        flexDirection="row"
                        justifyContent="flex-end"
                        display="flex">
                        <IconButton
                          icon={MaterialIconDeleteOutlined}
                          title="Remove Image"
                          onClick={() => onChange?.({...value, image: null})}
                        />
                      </Box>
                    </Layer>
                    <Image src={image.transform[0]} width="100%" height={200} />
                  </LayerContainer>
                )}
              </PlaceholderInput>
            </Card>
          </Box>
        </PanelSection>
        <PanelSectionHeader title="Peering" />
        <PanelSection>
          <Toggle
            label="Share with peers"
            description="Allow peers to publish this article."
            checked={shared}
            onChange={e => onChange?.({...value, shared: e.target.checked})}
          />
        </PanelSection>
      </Panel>
      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            transformations={[{height: 200}]}
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
