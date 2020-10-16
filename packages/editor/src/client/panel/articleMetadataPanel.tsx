import React, {useState, useEffect} from 'react'

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
  IconButton,
  Image,
  TagInput,
  AutocompleteInput,
  AutocompleteInputListProps,
  SelectList,
  SelectListItem,
  MarginProps,
  Avatar,
  PlaceholderImage,
  ZIndex
} from '@karma.run/ui'

import {
  MaterialIconClose,
  MaterialIconImageOutlined,
  MaterialIconEditOutlined
} from '@karma.run/icons'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'
import {slugify} from '../utility'
import {useAuthorListQuery, AuthorRefFragment, ImageRefFragment} from '../api'

import {useTranslation} from 'react-i18next'
export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface ArticleMetadata {
  readonly slug: string
  readonly preTitle: string
  readonly title: string
  readonly lead: string
  readonly authors: AuthorRefFragment[]
  readonly tags: string[]
  readonly properties: ArticleMetadataProperty[]
  readonly image?: ImageRefFragment
  readonly shared: boolean
  readonly breaking: boolean
}

export interface ArticleMetadataPanelProps {
  readonly value: ArticleMetadata

  onClose?(): void
  onChange?(value: ArticleMetadata): void
}

export function ArticleMetadataPanel({value, onClose, onChange}: ArticleMetadataPanelProps) {
  const {preTitle, title, lead, tags, authors, shared, breaking, image} = value

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
          title={t('articleEditor.panels.metadata')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('articleEditor.panels.close')}
              onClick={() => onClose?.()}
            />
          }
        />

        <PanelSection>
          <TextInput
            label={t('articleEditor.panels.preTitle')}
            value={preTitle}
            marginBottom={Spacing.ExtraSmall}
            onChange={e => onChange?.({...value, preTitle: e.target.value})}
          />

          <TextInput
            label={t('articleEditor.panels.title')}
            value={title}
            marginBottom={Spacing.ExtraSmall}
            onChange={e =>
              onChange?.({...value, title: e.target.value, slug: slugify(e.target.value)})
            }
          />

          <TextArea
            label={t('articleEditor.panels.lead')}
            value={lead}
            marginBottom={Spacing.ExtraSmall}
            onChange={e => onChange?.({...value, lead: e.target.value})}
          />

          <AuthorInput
            label={t('articleEditor.panels.authors')}
            value={authors}
            marginBottom={Spacing.ExtraSmall}
            onChange={authors => onChange?.({...value, authors: authors || []})}
          />

          <TagInput
            label={t('articleEditor.panels.tags')}
            description={t('articleEditor.panels.addTag')}
            value={tags}
            marginBottom={Spacing.Small}
            onChange={tags => onChange?.({...value, tags: tags ?? []})}
          />

          <Box>
            <Toggle
              label={t('articleEditor.panels.breakingNews')}
              checked={breaking}
              onChange={e => onChange?.({...value, breaking: e.target.checked})}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title={t('articleEditor.panels.image')} />
        <PanelSection dark>
          <Box height={200}>
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
                          title={t('articleEditor.panels.chooseImage')}
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
                          title={t('articleEditor.panels.editImage')}
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
                          title={t('articleEditor.panels.removeImage')}
                          onClick={() => onChange?.({...value, image: undefined})}
                        />
                      </Box>
                    </Box>
                    {image.previewURL && <Image src={image.previewURL} width="100%" height={200} />}
                  </Box>
                )}
              </PlaceholderInput>
            </Card>
          </Box>
        </PanelSection>
        <PanelSectionHeader title={t('articleEditor.panels.peering')} />
        <PanelSection>
          <Toggle
            label={t('articleEditor.panels.peerShare')}
            description={t('articleEditor.panels.allowPeerPublishing')}
            checked={shared}
            onChange={e => onChange?.({...value, shared: e.target.checked})}
          />
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

export interface AuthorInputProps extends MarginProps {
  label?: string
  description?: string
  value: AuthorRefFragment[]
  onChange(author?: AuthorRefFragment[]): void
}

export function AuthorInput(props: AuthorInputProps) {
  return (
    <AutocompleteInput
      {...props}
      valueToChipData={author => ({
        id: author.id,
        label: author.name,
        imageURL: author.image?.squareURL ?? undefined
      })}>
      {props => <AuthorInputList {...props} />}
    </AutocompleteInput>
  )
}

function AuthorInputList({
  isOpen,
  inputValue,
  highlightedIndex,
  getItemProps,
  getMenuProps
}: AutocompleteInputListProps) {
  const [items, setItems] = useState<AuthorRefFragment[]>([])
  const {data, loading: isLoading} = useAuthorListQuery({
    variables: {filter: inputValue || undefined, first: 10},
    fetchPolicy: 'network-only'
  })

  const {t} = useTranslation()

  useEffect(() => {
    setItems(data?.authors.nodes ?? [])
  }, [data])

  return (
    <SelectList {...getMenuProps()}>
      {isOpen && inputValue ? (
        !isLoading ? (
          items.length ? (
            items.map((item, index) => (
              <SelectListItem
                key={item.id}
                highlighted={index === highlightedIndex}
                {...getItemProps({item, index})}>
                <Box display="flex">
                  <Avatar marginRight={Spacing.Tiny}>
                    {item.image?.squareURL ? (
                      <Image src={item.image.squareURL} width={20} height={20} />
                    ) : (
                      <PlaceholderImage width={20} height={20} />
                    )}
                  </Avatar>
                  {item.name}
                </Box>
              </SelectListItem>
            ))
          ) : (
            <SelectListItem>{t('articleEditor.panels.noAuthorsFound')}</SelectListItem>
          )
        ) : (
          <SelectListItem>{t('articleEditor.panels.loading')}</SelectListItem>
        )
      ) : null}
    </SelectList>
  )
}
