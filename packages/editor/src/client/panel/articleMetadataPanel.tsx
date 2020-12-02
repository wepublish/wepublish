import React, {useState, useEffect} from 'react'

import {
  Button,
  CheckPicker,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  TagPicker,
  Toggle,
  HelpBlock
} from 'rsuite'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'
import {slugify} from '../utility'
import {useAuthorListQuery, AuthorRefFragment, ImageRefFragment} from '../api'

import {useTranslation} from 'react-i18next'
import {ChooseEditImage} from '../atoms/chooseEditImage'

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
  readonly hideAuthor: boolean
}

export interface ArticleMetadataPanelProps {
  readonly value: ArticleMetadata

  onClose?(): void
  onChange?(value: ArticleMetadata): void
}

export function ArticleMetadataPanel({value, onClose, onChange}: ArticleMetadataPanelProps) {
  const {preTitle, title, lead, tags, authors, shared, breaking, image, hideAuthor} = value

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
              onChange={lead => onChange?.({...value, lead})}
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
            <ControlLabel>{t('articleEditor.panels.hideAuthors')}</ControlLabel>
            <Toggle
              checked={hideAuthor}
              onChange={hideAuthor => onChange?.({...value, hideAuthor})}
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
        <ChooseEditImage
          header={''}
          image={image}
          disabled={false}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => onChange?.({...value, image: undefined})}
        />
        <Form fluid={true} style={{marginTop: '20px'}}>
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
