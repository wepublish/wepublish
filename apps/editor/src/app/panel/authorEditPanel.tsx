import styled from '@emotion/styled'
import {
  AuthorLink,
  AuthorListDocument,
  FullAuthorFragment,
  ImageRefFragment,
  Maybe,
  useAuthorQuery,
  useCreateAuthorMutation,
  useUpdateAuthorMutation
} from '@wepublish/editor/api'
import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  createDefaultValue,
  generateID,
  getOperationNameFromDocument,
  ImageEditPanel,
  ImageSelectPanel,
  ListInput,
  ListValue,
  PermissionControl,
  RichTextBlock,
  RichTextBlockValue,
  slugify,
  toggleRequiredLabel,
  useAuthorisation
} from '@wepublish/ui/editor'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdLink} from 'react-icons/md'
import {
  Button,
  Drawer,
  Form as RForm,
  Input,
  InputGroup as RInputGroup,
  Message,
  Panel,
  PanelGroup,
  Schema,
  toaster
} from 'rsuite'

const {ControlLabel, Group, Control} = RForm

const InputGroup = styled(RInputGroup)`
  width: 230px;
  margin-left: 5px;
`

const Controls = styled.div`
  display: flex;
  flex-direction: row;
`

const Form = styled(RForm)`
  height: 100%;
`

export interface AuthorEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullAuthorFragment): void
}

function AuthorEditPanel({id, onClose, onSave}: AuthorEditPanelProps) {
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

  const isAuthorized = useAuthorisation('CAN_CREATE_AUTHOR')

  const {
    data,
    loading: isLoading,
    error: loadError
  } = useAuthorQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const [createAuthor, {loading: isCreating, error: createError}] = useCreateAuthorMutation({
    refetchQueries: [getOperationNameFromDocument(AuthorListDocument)]
  })

  const [updateAuthor, {loading: isUpdating, error: updateError}] = useUpdateAuthorMutation()

  const isDisabled =
    isLoading || isCreating || isUpdating || loadError !== undefined || !isAuthorized

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
            bio
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
            bio
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
        formValue={{name}}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('authors.panels.editAuthor') : t('authors.panels.createAuthor')}
          </Drawer.Title>

          <Drawer.Actions>
            <PermissionControl qualifyingPermissions={['CAN_CREATE_AUTHOR']}>
              <Button
                appearance="primary"
                disabled={isDisabled}
                type="submit"
                data-testid="saveButton">
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>
            <Button appearance={'subtle'} onClick={() => onClose?.()}>
              {t('authors.panels.close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <PanelGroup>
            <Panel>
              <Group controlId="name">
                <ControlLabel>{toggleRequiredLabel(t('authors.panels.name'))}</ControlLabel>

                <Control
                  name="name"
                  value={name}
                  disabled={isDisabled}
                  onChange={(value: string) => {
                    setName(value)
                    setSlug(slugify(value))
                  }}
                />
              </Group>
              <Group controlId="jobTitle">
                <ControlLabel>{t('authors.panels.jobTitle')}</ControlLabel>
                <Control
                  name={t('authors.panels.jobTitle')}
                  value={jobTitle}
                  disabled={isDisabled}
                  onChange={(value: string) => {
                    setJobTitle(value)
                  }}
                />
              </Group>
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
                disabled={isDisabled}
                value={links}
                onChange={links => {
                  setLinks(links)
                }}
                defaultValue={{title: '', url: ''}}>
                {({value, onChange}) => (
                  <Controls>
                    <Control
                      name="title"
                      placeholder={t('authors.panels.title')}
                      value={value.title}
                      onChange={(title: string) => onChange({...value, title})}
                    />
                    <Group>
                      <InputGroup inside>
                        <RInputGroup.Addon>
                          <MdLink />
                        </RInputGroup.Addon>

                        <Control
                          name="link"
                          placeholder={t('authors.panels.link') + ':https//link.com'}
                          value={value.url}
                          onChange={(url: any) => onChange({...value, url})}
                          accepter={Input}
                        />
                      </InputGroup>
                    </Group>
                  </Controls>
                )}
              </ListInput>
            </Panel>
            <Panel header={t('authors.panels.bioInformation')}>
              <div className="richTextFrame">
                <RichTextBlock
                  disabled={isDisabled}
                  value={bio}
                  onChange={value => setBio(value)}
                />
              </div>
            </Panel>
          </PanelGroup>
        </Drawer.Body>
      </Form>

      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: ImageRefFragment) => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>

      <Drawer open={isEditModalOpen} size="sm">
        <ImageEditPanel
          id={image?.id}
          onClose={() => setEditModalOpen(false)}
          onSave={() => setEditModalOpen(false)}
        />
      </Drawer>
    </>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_AUTHOR',
  'CAN_GET_AUTHORS',
  'CAN_CREATE_AUTHOR',
  'CAN_DELETE_AUTHOR'
])(AuthorEditPanel)
export {CheckedPermissionComponent as AuthorEditPanel}
