import React, {useState} from 'react'
import {
  MaterialIconClose,
  MaterialIconImageOutlined,
  MaterialIconEditOutlined,
  MaterialIconCheck
} from '@karma.run/icons'

import {
  NavigationButton,
  Panel,
  PanelHeader,
  PanelSection,
  IconElement,
  Select,
  TextInput,
  Spacing,
  PanelSectionHeader,
  Card,
  Box,
  PlaceholderInput,
  ZIndex,
  IconButton,
  Typography,
  PlaceholderImage,
  Image,
  DescriptionList,
  DescriptionListItem,
  Drawer
} from '@karma.run/ui'

import {Teaser, TeaserType} from '../blocks/types'
import {TeaserStyle} from '../api'
import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

export interface TeaserEditPanelProps {
  initialTeaser: Teaser

  closeLabel?: string
  closeIcon?: IconElement

  onClose: () => void
  onConfirm: (teaser: Teaser) => void
}

export function TeaserEditPanel({
  initialTeaser,
  onClose,
  onConfirm,
  closeLabel = 'Close',
  closeIcon = MaterialIconClose
}: TeaserEditPanelProps) {
  const [style, setStyle] = useState(initialTeaser.style)
  const [image, setImage] = useState(initialTeaser.image)
  const [preTitle, setPreTitle] = useState(initialTeaser.preTitle)
  const [title, setTitle] = useState(initialTeaser.title)
  const [lead, setLead] = useState(initialTeaser.lead)

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  return (
    <>
      <Panel>
        <PanelHeader
          title="Edit Teaser"
          leftChildren={
            <NavigationButton icon={closeIcon} label={closeLabel} onClick={() => onClose()} />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconCheck}
              label="Confirm"
              onClick={() =>
                onConfirm({
                  ...initialTeaser,
                  style,
                  preTitle: preTitle || undefined,
                  title: title || undefined,
                  lead: lead || undefined,
                  image
                })
              }
            />
          }
        />
        <PanelSection dark>{previewForTeaser(initialTeaser)}</PanelSection>
        <PanelSectionHeader title="Display Options" />
        <PanelSection>
          <Select
            label="Style"
            value={{id: style}}
            options={[{id: TeaserStyle.Default}, {id: TeaserStyle.Light}, {id: TeaserStyle.Text}]}
            onChange={value => {
              if (value?.id) {
                setStyle(value.id)
              }
            }}
            renderListItem={renderTeaserStyleListItem}
            marginBottom={Spacing.Small}
          />

          <TextInput
            label="Pre-title"
            value={preTitle}
            onChange={e => setPreTitle(e.target.value)}
            marginBottom={Spacing.Small}
            description="Leave empty to use original pre-title."
          />

          <TextInput
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            marginBottom={Spacing.Small}
            description="Leave empty to use original title."
          />

          <TextInput
            label="Lead"
            value={lead}
            onChange={e => setLead(e.target.value)}
            marginBottom={Spacing.Small}
            description="Leave empty to use original lead."
          />

          <Box marginBottom={Spacing.ExtraSmall}>
            <Typography variant="subtitle1" color="gray">
              Image
            </Typography>
          </Box>
          <Box height={200} marginBottom={Spacing.ExtraSmall}>
            <Card>
              <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
                {image && (
                  <Box position="relative" width="100%" height="100%">
                    <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
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
                          icon={MaterialIconClose}
                          title="Remove Image"
                          onClick={() => setImage(undefined)}
                        />
                      </Box>
                    </Box>
                    {image.previewURL && <Image src={image.previewURL} width="100%" height={200} />}
                  </Box>
                )}
              </PlaceholderInput>
            </Card>
          </Box>
          <Typography variant="subtitle1" color="gray">
            Leave empty to use original image.
          </Typography>
        </PanelSection>
      </Panel>
      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={value => {
              setChooseModalOpen(false)
              setImage(value)
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => <ImagedEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />}
      </Drawer>
    </>
  )
}

function previewForTeaser(teaser: Teaser) {
  let type: string
  let imageURL: string | undefined
  let preTitle: string | undefined
  let title: string | undefined
  let lead: string | undefined

  switch (teaser.type) {
    case TeaserType.Article:
      type = 'Article'
      imageURL = teaser.article.latest.image?.previewURL ?? undefined
      preTitle = teaser.article.latest.preTitle ?? undefined
      title = teaser.article.latest.title
      lead = teaser.article.latest.lead ?? undefined
      break

    case TeaserType.PeerArticle:
      type = 'Peer Article'
      imageURL = teaser.article?.latest.image?.previewURL ?? undefined
      preTitle = teaser.article?.latest.preTitle ?? undefined
      title = teaser.article?.latest.title
      lead = teaser.article?.latest.lead ?? undefined
      break

    case TeaserType.Page:
      type = 'Page'
      imageURL = teaser.page.latest.image?.previewURL ?? undefined
      title = teaser.page.latest.title
      lead = teaser.page.latest.description ?? undefined
      break
  }

  return (
    <>
      <Card marginBottom={Spacing.Medium} height={200}>
        {imageURL ? (
          <Image src={imageURL} width="100%" height="100%" />
        ) : (
          <PlaceholderImage width="100%" height="100%" />
        )}
      </Card>
      <DescriptionList>
        <DescriptionListItem label="Type">{type}</DescriptionListItem>
        <DescriptionListItem label="Pre-title">{preTitle || '-'}</DescriptionListItem>
        <DescriptionListItem label="Title">{title || '-'}</DescriptionListItem>
        <DescriptionListItem label="Lead">{lead || '-'}</DescriptionListItem>
      </DescriptionList>
    </>
  )
}

function renderTeaserStyleListItem(value: {id: TeaserStyle}) {
  switch (value.id) {
    case TeaserStyle.Default:
      return 'Default'

    case TeaserStyle.Light:
      return 'Light'

    case TeaserStyle.Text:
      return 'Text'
  }
}
