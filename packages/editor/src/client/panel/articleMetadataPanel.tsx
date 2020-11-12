import React, {useState, useEffect} from 'react'

import {
  Button,
  CheckPicker,
  ControlLabel,
  Drawer,
  Dropdown,
  Form,
  FormControl,
  FormGroup,
  Icon,
  TagPicker,
  Toggle,
  Panel,
  IconButton,
  HelpBlock
} from 'rsuite'

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

  const [foundAuthors, setFoundAuthors] = useState<AuthorRefFragment[]>([])
  const [authorsFilter, setAuthorsFilter] = useState('')

  const authorsVariables = {filter: authorsFilter || undefined, first: 10}
  const {data} = useAuthorListQuery({
    variables: authorsVariables,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (data?.authors?.nodes) {
      setFoundAuthors(data?.authors.nodes)
    }
  }, [data?.authors])

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.metadata')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Form fluid={true}>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.preTitle')}</ControlLabel>
            <FormControl value={preTitle} onChange={preTitle => onChange?.({...value, preTitle})} />
          </FormGroup>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.title')}</ControlLabel>
            <FormControl
              value={title}
              onChange={title => onChange?.({...value, title, slug: slugify(title)})}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.lead')}</ControlLabel>
            <FormControl
              rows={5}
              componentClass="textarea"
              value={lead}
              onChange={title => onChange?.({...value, lead})}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.authors')}</ControlLabel>
            <CheckPicker
              cleanable={true}
              value={authors.map(author => author.id)}
              data={foundAuthors.map(author => ({value: author.id, label: author.name}))}
              onSearch={searchKeyword => setAuthorsFilter(searchKeyword)}
              onChange={authorsID => {
                const authors = foundAuthors.filter(author => authorsID.includes(author.id))
                onChange?.({...value, authors})
              }}
              block
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.tags')}</ControlLabel>
            <TagPicker
              block
              value={tags}
              creatable={true}
              data={tags.map(tag => ({label: tag, value: tag}))}
              onChange={tags => {
                onChange?.({...value, tags})
              }}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.breakingNews')}</ControlLabel>
            <Toggle checked={breaking} onChange={breaking => onChange?.({...value, breaking})} />
          </FormGroup>
        </Form>

        <Panel
          bordered={true}
          style={{
            height: '200px',
            backgroundSize: 'cover',
            backgroundImage: `url(${image?.previewURL ?? 'https://via.placeholder.com/240x240'})`
          }}>
          <Dropdown
            renderTitle={() => {
              return <IconButton appearance="subtle" icon={<Icon icon="wrench" />} circle />
            }}>
            <Dropdown.Item onClick={() => setChooseModalOpen(true)}>
              <Icon icon="image" /> {t('articleEditor.panels.chooseImage')}
            </Dropdown.Item>
            <Dropdown.Item disabled={!image} onClick={() => setEditModalOpen(true)}>
              <Icon icon="pencil" /> {t('articleEditor.panels.editImage')}
            </Dropdown.Item>
            <Dropdown.Item
              disabled={!image}
              onClick={() => onChange?.({...value, image: undefined})}>
              <Icon icon="close" /> {t('articleEditor.panels.removeImage')}
            </Dropdown.Item>
          </Dropdown>
        </Panel>
        <Form fluid={true}>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.peering')}</ControlLabel>
            <Toggle checked={shared} onChange={shared => onChange?.({...value, shared})} />
            <HelpBlock>{t('articleEditor.panels.allowPeerPublishing')}</HelpBlock>
          </FormGroup>
        </Form>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Drawer.Footer>

      <Drawer
        show={isChooseModalOpen}
        size={'sm'}
        onHide={() => {
          setChooseModalOpen(false)
        }}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {value.image && (
        <Drawer
          show={isEditModalOpen}
          size={'sm'}
          onHide={() => {
            setEditModalOpen(false)
          }}>
          <ImagedEditPanel id={value.image!.id} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
    </>
  )
}
