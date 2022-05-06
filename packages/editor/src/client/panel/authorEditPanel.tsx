import React, {useState, useEffect} from 'react'

import {Button, Drawer, Form, Panel, Input, toaster, Message, PanelGroup, InputGroup} from 'rsuite'

import {ListInput, ListValue} from '../atoms/listInput'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

import {
  useCreateAuthorMutation,
  useAuthorQuery,
  useUpdateAuthorMutation,
  AuthorLink,
  ImageRefFragment,
  Maybe,
  FullAuthorFragment,
  AuthorListDocument
} from '../api'

import {slugify, generateID, getOperationNameFromDocument} from '../utility'
import {RichTextBlock, createDefaultValue} from '../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'

import {useTranslation} from 'react-i18next'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import LinkIcon from '@rsuite/icons/legacy/Link'

export interface AuthorEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullAuthorFragment): void
}

export function AuthorEditPanel({id, onClose, onSave}: AuthorEditPanelProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [jobTitle, setJobTitle] = useState<Maybe<string>>()
  const [image, setImage] = useState<Maybe<ImageRefFragment>>()
  const [bio, setBio] = useState<RichTextBlockValue>(createDefaultValue())
  const [links, setLinks] = useState<ListValue<AuthorLink>[]>([
    {id: generateID(), value: {title: '', url: ''}}
  ])

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {data, loading: isLoading, error: loadError} = useAuthorQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const [createAuthor, {loading: isCreating, error: createError}] = useCreateAuthorMutation({
    refetchQueries: [getOperationNameFromDocument(AuthorListDocument)]
  })

  const [updateAuthor, {loading: isUpdating, error: updateError}] = useUpdateAuthorMutation()

  const isDisabled = isLoading || isCreating || isUpdating || loadError !== undefined

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.author) {
      setName(data.author.name)
      setSlug(data.author.slug)
      setJobTitle(data.author.jobTitle)
      setImage(data.author.image)
      setBio(data.author.bio ? data.author.bio : createDefaultValue())
      setLinks(
        data.author.links
          ? data.author.links.map(link => ({
              id: generateID(),
              value: {
                title: link.title,
                url: link.url
              }
            }))
          : []
      )
    }
  }, [data?.author])

  useEffect(() => {
    const error = loadError?.message ?? createError?.message ?? updateError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, createError, updateError])

  function handleImageChange(image: ImageRefFragment) {
    setImage(image)
  }

  async function handleSave() {
    if (id) {
      const {data} = await updateAuthor({
        variables: {
          id,
          input: {
            name,
            slug,
            jobTitle,
            imageID: image?.id,
            links: links.map(({value}) => value),
            bio: bio
          }
        }
      })

      if (data?.updateAuthor) onSave?.(data.updateAuthor)
    } else {
      const {data} = await createAuthor({
        variables: {
          input: {
            name,
            slug,
            jobTitle,
            imageID: image?.id,
            links: links.map(({value}) => value),
            bio: bio
          }
        }
      })

      if (data?.createAuthor) onSave?.(data.createAuthor)
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('authors.panels.editAuthor') : t('authors.panels.createAuthor')}
        </Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
            {id ? t('authors.panels.save') : t('authors.panels.create')}
          </Button>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('authors.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <PanelGroup>
          <Panel>
            <Form fluid={true}>
              <Form.Group>
                <Form.ControlLabel>{t('authors.panels.name')}</Form.ControlLabel>
                <Form.Control
                  name={t('authors.panels.name')}
                  value={name}
                  disabled={isDisabled}
                  onChange={(value: string) => {
                    setName(value)
                    setSlug(slugify(value))
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.ControlLabel>{t('authors.panels.jobTitle')}</Form.ControlLabel>
                <Form.Control
                  name={t('authors.panels.jobTitle')}
                  value={jobTitle}
                  disabled={isDisabled}
                  onChange={value => {
                    setJobTitle(value)
                  }}
                />
              </Form.Group>
            </Form>
          </Panel>
          <Panel header={t('authors.panels.image')}>
            <ChooseEditImage
              image={image}
              header={''}
              top={0}
              left={0}
              disabled={isLoading}
              openChooseModalOpen={() => setChooseModalOpen(true)}
              openEditModalOpen={() => setEditModalOpen(true)}
              removeImage={() => setImage(undefined)}
            />
          </Panel>
          <Panel header={t('authors.panels.links')}>
            <ListInput
              value={links}
              onChange={links => setLinks(links)}
              defaultValue={{title: '', url: ''}}>
              {({value, onChange}) => (
                <div style={{display: 'flex', flexDirection: 'row'}}>
                  <Input
                    placeholder={t('authors.panels.title')}
                    style={{
                      width: '30%',
                      marginRight: '10px'
                    }}
                    value={value.title}
                    onChange={title => onChange({...value, title})}
                  />
                  <InputGroup inside>
                    <InputGroup.Addon>
                      <LinkIcon />
                    </InputGroup.Addon>
                    <Input
                      placeholder={t('authors.panels.link')}
                      style={{
                        width: '70%'
                      }}
                      value={value.url}
                      onChange={url => onChange({...value, url})}
                    />
                  </InputGroup>
                </div>
              )}
            </ListInput>
          </Panel>
          <Panel header={t('authors.panels.bioInformation')}>
            <div className="richTextFrame">
              <RichTextBlock value={bio} onChange={value => setBio(value)} />
            </div>
          </Panel>
        </PanelGroup>
      </Drawer.Body>

      <Drawer open={isChooseModalOpen} size={'sm'} onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>

      <Drawer open={isEditModalOpen} size={'sm'}>
        <ImagedEditPanel
          id={image?.id}
          onClose={() => setEditModalOpen(false)}
          onSave={() => setEditModalOpen(false)}
        />
      </Drawer>
    </>
  )
}
