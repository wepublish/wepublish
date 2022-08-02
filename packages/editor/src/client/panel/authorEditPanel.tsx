import React, {useState, useEffect} from 'react'

import {
  Button,
  Drawer,
  Form,
  Panel,
  Input,
  toaster,
  Message,
  PanelGroup,
  InputGroup,
  Schema
} from 'rsuite'

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
import {toggleRequiredLabel} from '../toggleRequiredLabel'

export interface AuthorEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullAuthorFragment): void
}

export function AuthorEditPanel({id, onClose, onSave}: AuthorEditPanelProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [jobTitle, setJobTitle] = useState('')
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
      setJobTitle(data.author.jobTitle ?? '')
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

  // Defines field requirements
  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    link: StringType().isURL(t('errorMessages.invalidUrlErrorMessage'))
  })

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        fluid
        model={validationModel}
        formValue={{name: name}}
        style={{height: '100%'}}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('authors.panels.editAuthor') : t('authors.panels.createAuthor')}
          </Drawer.Title>

          <Drawer.Actions>
            <Button
              appearance="primary"
              disabled={isDisabled}
              type="submit"
              data-testid="saveButton">
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
              <Form.Group controlId="name">
                <Form.ControlLabel>
                  {toggleRequiredLabel(t('authors.panels.name'))}
                </Form.ControlLabel>

                <Form.Control
                  name="name"
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
                  onChange={(value: string) => {
                    setJobTitle(value)
                  }}
                />
              </Form.Group>
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
            <Panel header={t('authors.panels.links')} className="authorLinks">
              <ListInput
                value={links}
                onChange={links => {
                  setLinks(links)
                }}
                defaultValue={{title: '', url: ''}}>
                {({value, onChange}) => (
                  <div style={{display: 'flex', flexDirection: 'row'}}>
                    <Form.Control
                      name="title"
                      placeholder={t('authors.panels.title')}
                      value={value.title}
                      onChange={(title: string) => onChange({...value, title})}
                    />
                    <Form.Group>
                      <InputGroup inside style={{width: '230px', marginLeft: '5px'}}>
                        <InputGroup.Addon>
                          <LinkIcon />
                        </InputGroup.Addon>

                        <Form.Control
                          name="link"
                          placeholder={t('authors.panels.link') + ':https//link.com'}
                          value={value.url}
                          onChange={(url: any) => onChange({...value, url})}
                          accepter={Input}
                        />
                      </InputGroup>
                    </Form.Group>
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
      </Form>

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
