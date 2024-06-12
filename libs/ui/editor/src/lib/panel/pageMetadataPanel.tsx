import styled from '@emotion/styled'
import {ImageRefFragment, TagType} from '@wepublish/editor/api'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdListAlt, MdSettings, MdShare} from 'react-icons/md'
import {
  Button,
  Drawer,
  Form,
  Input,
  Message,
  Nav as RNav,
  Panel,
  TagPicker as RTagPicker,
  Toggle as RToggle
} from 'rsuite'
import {MetaDataType} from '../blocks'
import {
  ChooseEditImage,
  ListInput,
  ListValue,
  PermissionControl,
  SelectTags,
  Textarea,
  createCheckedPermissionComponent,
  useAuthorisation
} from '../atoms'
import {generateID} from '../utility'
import {ImageSelectPanel} from './imageSelectPanel'
import {ImageEditPanel} from './imageEditPanel'

const Nav = styled(RNav)`
  margin-bottom: 20px;
`

const Toggle = styled(RToggle)`
  max-width: 70px;
  min-width: 70px;
`

const InputWidth60 = styled(Input)`
  width: 60%;
`

const InputWidth40 = styled(Input)`
  width: 40%;
  margin-right: 10px;
`

const InputList = styled.div`
  display: flex;
  flex-direction: row;
`

const TagPicker = styled(RTagPicker)`
  width: 100%;
`

const FormGroup = styled(Form.Group)`
  padding-top: 6px;
  padding-left: 8px;
`

export interface PageMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface PageMetadata {
  readonly slug?: string
  readonly title?: string
  readonly description: string
  readonly tags: string[]
  readonly url: string
  readonly properties: PageMetadataProperty[]
  readonly image?: ImageRefFragment
  readonly socialMediaTitle?: string
  readonly socialMediaDescription?: string
  readonly socialMediaImage?: ImageRefFragment
}

export interface PageMetadataPanelProps {
  readonly value: PageMetadata

  onClose?(): void

  onChange?(value: PageMetadata): void
}

function PageMetadataPanel({value, onClose, onChange}: PageMetadataPanelProps) {
  const {
    title,
    description,
    slug,
    tags,
    image,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage,
    properties
  } = value

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const [activeKey, setActiveKey] = useState(MetaDataType.General)

  const isAuthorized = useAuthorisation('CAN_CREATE_PAGE')

  const [metaDataProperties, setMetadataProperties] = useState<ListValue<PageMetadataProperty>[]>(
    properties
      ? properties.map(metaDataProperty => ({
          id: generateID(),
          value: metaDataProperty
        }))
      : []
  )

  const {t} = useTranslation()

  useEffect(() => {
    if (metaDataProperties) {
      onChange?.({...value, properties: metaDataProperties.map(({value}) => value)})
    }
  }, [metaDataProperties])

  function handleImageChange(currentImage: ImageRefFragment) {
    switch (activeKey) {
      case MetaDataType.General: {
        const image = currentImage
        onChange?.({...value, image})
        break
      }
      case MetaDataType.SocialMedia: {
        const socialMediaImage = currentImage
        onChange?.({...value, socialMediaImage})
        break
      }
      default: {
        // Handle unexpected cases
        console.warn(`Unhandled activeKey: ${activeKey}`)
      }
    }
  }

  function currentContent(): JSX.Element {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <>
            <Form.Group>
              <Message showIcon type="info">
                {t('pageEditor.panels.metadataInfo')}
              </Message>
            </Form.Group>
            <Form.Group controlId="socialMediaTitle">
              <Form.ControlLabel>{t('pageEditor.panels.socialMediaTitle')}</Form.ControlLabel>
              <Form.Control
                name="social-media-title"
                value={socialMediaTitle}
                onChange={(socialMediaTitle: string) => {
                  onChange?.({...value, socialMediaTitle})
                }}
              />
            </Form.Group>
            <Form.Group controlId="socialMediaDescription">
              <Form.ControlLabel>{t('pageEditor.panels.socialMediaDescription')}</Form.ControlLabel>
              <Form.Control
                name="social-media-description"
                rows={5}
                accepter={Textarea}
                value={socialMediaDescription}
                onChange={(socialMediaDescription: string) => {
                  onChange?.({...value, socialMediaDescription})
                }}
              />
            </Form.Group>
            <Form.Group controlId="socialMediaImage">
              <Form.ControlLabel>{t('pageEditor.panels.socialMediaImage')}</Form.ControlLabel>
              <ChooseEditImage
                header={''}
                image={socialMediaImage}
                disabled={false}
                openChooseModalOpen={() => {
                  setChooseModalOpen(true)
                }}
                openEditModalOpen={() => {
                  setEditModalOpen(true)
                }}
                removeImage={() => onChange?.({...value, socialMediaImage: undefined})}
              />
            </Form.Group>
          </>
        )
      case MetaDataType.General:
        return (
          <>
            <Form.Group controlId="pageSlug">
              <Form.ControlLabel>{t('pageEditor.panels.slug')}</Form.ControlLabel>
              <Form.Control
                name="slug"
                value={slug}
                onChange={(slug: string) => onChange?.({...value, slug})}
              />
            </Form.Group>
            <Form.Group controlId="pageTitle">
              <Form.ControlLabel>{t('pageEditor.panels.title')}</Form.ControlLabel>
              <Form.Control
                name="title"
                value={title}
                onChange={(title: string) => onChange?.({...value, title})}
              />
              <Form.HelpText>{t('pageEditor.panels.titleHelpBlock')}</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="pageDescription">
              <Form.ControlLabel>{t('pageEditor.panels.description')}</Form.ControlLabel>
              <Form.Control
                name="description"
                accepter={Textarea}
                value={description}
                onChange={(description: string) => onChange?.({...value, description})}
              />
              <Form.HelpText>{t('pageEditor.panels.descriptionHelpBlock')}</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="pageTags">
              <Form.ControlLabel>{t('pageEditor.panels.tags')}</Form.ControlLabel>
              <SelectTags
                disabled={!isAuthorized}
                selectedTags={tags}
                setSelectedTags={tagsValue => onChange?.({...value, tags: tagsValue ?? []})}
                tagType={TagType.Page}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('pageEditor.panels.postImage')}</Form.ControlLabel>
              <ChooseEditImage
                header={''}
                image={image}
                disabled={false}
                openChooseModalOpen={() => {
                  setChooseModalOpen(true)
                }}
                openEditModalOpen={() => {
                  setEditModalOpen(true)
                }}
                removeImage={() => onChange?.({...value, image: undefined})}
              />
            </Form.Group>
          </>
        )
      case MetaDataType.Properties:
        return (
          <>
            <Form.Group>
              <Message showIcon type="info">
                {t('pageEditor.panels.propertiesInfo')}
              </Message>
            </Form.Group>
            <Form.Group controlId="pageProperties">
              <Form.ControlLabel>{t('pageEditor.panels.properties')}</Form.ControlLabel>
              <ListInput
                disabled={!isAuthorized}
                value={metaDataProperties}
                onChange={propertiesItemInput => setMetadataProperties(propertiesItemInput)}
                defaultValue={{key: '', value: '', public: true}}>
                {({value, onChange}) => (
                  <InputList>
                    <InputWidth40
                      placeholder={t('pageEditor.panels.key')}
                      value={value.key}
                      onChange={propertyKey => {
                        onChange({...value, key: propertyKey})
                      }}
                    />
                    <InputWidth60
                      placeholder={t('pageEditor.panels.value')}
                      value={value.value}
                      onChange={propertyValue => {
                        onChange({...value, value: propertyValue})
                      }}
                    />
                    <FormGroup>
                      <Toggle
                        checkedChildren={t('pageEditor.panels.public')}
                        unCheckedChildren={t('pageEditor.panels.private')}
                        checked={value.public}
                        onChange={isPublic => onChange({...value, public: isPublic})}
                      />
                    </FormGroup>
                  </InputList>
                )}
              </ListInput>
            </Form.Group>
          </>
        )
      default:
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <></>
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('pageEditor.panels.metadata')}</Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
            <Button appearance="primary" onClick={() => onClose?.()}>
              {t('saveAndClose')}
            </Button>
          </PermissionControl>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={activeKey}
          onSelect={activeKey => setActiveKey(activeKey)}>
          <RNav.Item eventKey={MetaDataType.General} icon={<MdSettings />}>
            {t('articleEditor.panels.general')}
          </RNav.Item>
          <RNav.Item eventKey={MetaDataType.SocialMedia} icon={<MdShare />}>
            {t('articleEditor.panels.socialMedia')}
          </RNav.Item>
          <RNav.Item eventKey={MetaDataType.Properties} icon={<MdListAlt />}>
            {t('pageEditor.panels.properties')}
          </RNav.Item>
        </Nav>

        <Panel>
          <Form fluid disabled={!isAuthorized}>
            {currentContent()}
          </Form>
        </Panel>
      </Drawer.Body>

      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: ImageRefFragment) => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {(value.image || value.socialMediaImage) && (
        <Drawer
          open={isEditModalOpen}
          size="sm"
          onClose={() => {
            setEditModalOpen(false)
          }}>
          <ImageEditPanel
            id={activeKey === MetaDataType.General ? value.image?.id : value.socialMediaImage?.id}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAGE',
  'CAN_GET_PAGES',
  'CAN_CREATE_PAGE',
  'CAN_DELETE_PAGE',
  'CAN_PUBLISH_PAGE'
])(PageMetadataPanel)
export {CheckedPermissionComponent as PageMetadataPanel}
