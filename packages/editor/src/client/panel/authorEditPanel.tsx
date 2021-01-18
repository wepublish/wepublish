import React, {useState, useEffect} from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Panel,
  Input,
  Alert,
  PanelGroup,
  InputGroup,
  Icon
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

export interface AuthorEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullAuthorFragment): void
}

export function AuthorEditPanel({id, onClose, onSave}: AuthorEditPanelProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [image, setImage] = useState<Maybe<ImageRefFragment>>()
  const [bio, setBio] = useState<RichTextBlockValue>(createDefaultValue())
  const [links, setLinks] = useState<ListValue<AuthorLink>[]>([])

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
    if (error) Alert.error(error, 0)
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
      </Drawer.Header>

      <Drawer.Body>
        <PanelGroup accordion>
          <Panel header={t('authors.panels.name')} defaultExpanded>
            <Form fluid={true}>
              <InputGroup inside>
                <InputGroup.Addon>
                  <Icon icon="avatar" />
                </InputGroup.Addon>
                <FormControl
                  name={t('authors.panels.name')}
                  value={name}
                  disabled={isDisabled}
                  onChange={value => {
                    setName(value)
                    setSlug(slugify(value))
                  }}
                />
              </InputGroup>
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
                      <Icon icon="link" />
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
            <RichTextBlock value={bio} onChange={value => setBio(value)} />
          </Panel>
        </PanelGroup>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {id ? t('authors.panels.save') : t('authors.panels.create')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('authors.panels.close')}
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
      <Drawer show={isEditModalOpen} size={'sm'}>
        <ImagedEditPanel
          id={image?.id}
          onClose={() => setEditModalOpen(false)}
          onSave={() => setEditModalOpen(false)}
        />
      </Drawer>
    </>
  )
}
