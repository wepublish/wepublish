import React, {useState} from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  TagPicker,
  Toggle,
  HelpBlock,
  Nav,
  Icon,
  Panel,
  Message,
  InputGroup,
  IconButton,
  Tooltip,
  Whisper
} from 'rsuite'

import {ImagedEditPanel} from './imageEditPanel'
import {AuthorCheckPicker} from './authorCheckPicker'
import {ImageSelectPanel} from './imageSelectPanel'
import {slugify} from '../utility'
import {AuthorRefFragment, ImageRefFragment} from '../api'

import {useTranslation, Trans} from 'react-i18next'
import {MetaDataType} from '../blocks/types'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {ListInput, ListValue} from '../atoms/listInput'

export interface ArticleMetadataProperty {
  readonly propertyKey: string
  readonly propertyValue: string
  readonly propertyIsPublic: boolean
}

export interface ArticleMetadata {
  readonly slug: string
  readonly preTitle: string
  readonly title: string
  readonly lead: string
  readonly seoTitle: string
  readonly authors: AuthorRefFragment[]
  readonly tags: string[]
  readonly properties: ArticleMetadataProperty[]
  readonly image?: ImageRefFragment
  readonly shared: boolean
  readonly breaking: boolean
  readonly hideAuthor: boolean
  readonly socialMediaTitle?: string
  readonly socialMediaDescription?: string
  readonly socialMediaAuthors: AuthorRefFragment[]
  readonly socialMediaImage?: ImageRefFragment
}

export interface InfoData {
  readonly charCount: number
}

export interface ArticleMetadataPanelProps {
  readonly value: ArticleMetadata
  readonly infoData: InfoData

  onClose?(): void
  onChange?(value: ArticleMetadata): void
}

export function ArticleMetadataPanel({
  value,
  infoData,
  onClose,
  onChange
}: ArticleMetadataPanelProps) {
  const {
    preTitle,
    title,
    lead,
    seoTitle,
    slug,
    tags,
    authors,
    shared,
    breaking,
    image,
    hideAuthor,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaAuthors,
    socialMediaImage,
    properties
  } = value

  const [activeKey, setActiveKey] = useState(MetaDataType.General)

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const [metaDataProperties, setMetadataProperties] = useState<
    ListValue<ArticleMetadataProperty>[]
  >([])

  const {t} = useTranslation()

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
      }
    }
  }

  const preTitleMax = 30
  const seoTitleMax = 70
  const titleMax = 140
  const leadMax = 350
  const socialMediaTitleMax = 100
  const socialMediaDescriptionMax = 140

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <Panel>
            <Form fluid={true}>
              <FormGroup>
                <Message showIcon type="info" description={t('pageEditor.panels.metadataInfo')} />
              </FormGroup>
              <FormGroup>
                <ControlLabel>
                  {t('articleEditor.panels.socialMediaTitle')}
                  <label style={{float: 'right'}}>
                    {' '}
                    {value.socialMediaTitle ? value.socialMediaTitle.length : 0}/
                    {socialMediaTitleMax}
                  </label>
                </ControlLabel>
                <FormControl
                  value={socialMediaTitle || ''}
                  onChange={socialMediaTitle => {
                    onChange?.({...value, socialMediaTitle})
                  }}
                />
                {value.socialMediaTitle && value.socialMediaTitle?.length > socialMediaTitleMax && (
                  <label style={{color: 'gold'}}>
                    {t('articleEditor.panels.charCountWarning', {
                      charCountWarning: socialMediaTitleMax
                    })}
                  </label>
                )}
              </FormGroup>
              <FormGroup>
                <ControlLabel>
                  {t('articleEditor.panels.socialMediaDescription')}
                  <label style={{float: 'right'}}>
                    {' '}
                    {value.socialMediaDescription ? value.socialMediaDescription.length : 0}/
                    {socialMediaDescriptionMax}
                  </label>
                </ControlLabel>
                <FormControl
                  rows={5}
                  componentClass="textarea"
                  value={socialMediaDescription || ''}
                  onChange={socialMediaDescription => {
                    onChange?.({...value, socialMediaDescription})
                  }}
                />
                {value.socialMediaDescription &&
                  value.socialMediaDescription?.length > socialMediaDescriptionMax && (
                    <label style={{color: 'gold'}}>
                      {t('articleEditor.panels.charCountWarning', {
                        charCountWarning: socialMediaDescriptionMax
                      })}
                    </label>
                  )}
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.socialMediaAuthors')}</ControlLabel>
                <AuthorCheckPicker
                  list={socialMediaAuthors}
                  onChange={authors => onChange?.({...value, socialMediaAuthors: authors})}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.socialMediaImage')}</ControlLabel>
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
              </FormGroup>
            </Form>
          </Panel>
        )
      case MetaDataType.General:
        return (
          <Panel>
            <Form fluid={true}>
              <div style={{paddingBottom: '20px'}}>
                {t('articleEditor.panels.totalCharCount', {totalCharCount: infoData.charCount})}
              </div>
              <FormGroup>
                <ControlLabel>
                  {t('articleEditor.panels.preTitle')}
                  <label style={{float: 'right'}}>
                    {' '}
                    {value.preTitle.length}/{preTitleMax}{' '}
                  </label>
                </ControlLabel>
                <FormControl
                  value={preTitle}
                  onChange={preTitle => onChange?.({...value, preTitle})}
                />
                {value.preTitle.length > preTitleMax && (
                  <label style={{color: 'gold'}}>
                    {t('articleEditor.panels.charCountWarning', {charCountWarning: preTitleMax})}
                  </label>
                )}
              </FormGroup>
              <FormGroup>
                <ControlLabel>
                  {t('articleEditor.panels.title')}
                  <label style={{float: 'right'}}>
                    {' '}
                    {value.title.length}/{titleMax}{' '}
                  </label>
                </ControlLabel>
                <FormControl value={title} onChange={title => onChange?.({...value, title})} />
                <HelpBlock>{t('articleEditor.panels.titleHelpBlock')}</HelpBlock>
                {value.title.length > titleMax && (
                  <label style={{color: 'gold'}}>
                    {t('articleEditor.panels.charCountWarning', {charCountWarning: titleMax})}
                  </label>
                )}
              </FormGroup>
              <FormGroup>
                <ControlLabel>
                  {t('articleEditor.panels.lead')}
                  <label style={{float: 'right'}}>
                    {' '}
                    {value.lead.length}/{leadMax}{' '}
                  </label>
                </ControlLabel>
                <FormControl
                  rows={5}
                  componentClass="textarea"
                  value={lead}
                  onChange={lead => {
                    onChange?.({...value, lead})
                  }}
                />
                <HelpBlock>{t('articleEditor.panels.leadHelpBlock')}</HelpBlock>
                {value.lead.length > leadMax && (
                  <label style={{color: 'gold'}}>
                    {t('articleEditor.panels.charCountWarning', {charCountWarning: leadMax})}
                  </label>
                )}
              </FormGroup>
              <FormGroup>
                <ControlLabel>
                  {t('articleEditor.panels.seoTitle')}
                  <label style={{float: 'right'}}>
                    {' '}
                    {value.seoTitle.length}/{seoTitleMax}{' '}
                  </label>
                </ControlLabel>
                <FormControl
                  value={seoTitle}
                  onChange={seoTitle => onChange?.({...value, seoTitle})}
                />
                <HelpBlock>
                  <Trans i18nKey={'articleEditor.panels.seoTitleHelpBlock'}>
                    text{' '}
                    <a
                      href="https://wepublish.ch/just-another-page/"
                      target="_blank"
                      rel="noreferrer">
                      more text
                    </a>
                  </Trans>
                </HelpBlock>
                {value.seoTitle.length > seoTitleMax && (
                  <label style={{color: 'gold'}}>
                    {t('articleEditor.panels.charCountWarning', {charCountWarning: seoTitleMax})}
                  </label>
                )}
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.slug')}</ControlLabel>
                <InputGroup style={{width: '100%'}}>
                  <FormControl
                    value={slug}
                    onChange={slug => onChange?.({...value, slug})}
                    onBlur={() => onChange?.({...value, slug: slugify(slug)})}
                  />
                  <Whisper
                    placement="top"
                    trigger="hover"
                    speaker={<Tooltip>{t('articleEditor.panels.slugifySeoTitle')}</Tooltip>}>
                    <IconButton
                      icon={<Icon icon="magic" />}
                      onClick={() => {
                        onChange?.({...value, title, slug: slugify(seoTitle)})
                      }}
                    />
                  </Whisper>
                </InputGroup>
                <HelpBlock>
                  <Trans i18nKey={'articleEditor.panels.dontChangeSlug'}>
                    text{' '}
                    <a
                      href="https://wepublish.ch/just-another-page-2/"
                      target="_blank"
                      rel="noreferrer"></a>
                  </Trans>
                </HelpBlock>
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.authors')}</ControlLabel>
                <AuthorCheckPicker
                  list={authors}
                  onChange={authors => onChange?.({...value, authors})}
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
                <Toggle
                  checked={breaking}
                  onChange={breaking => onChange?.({...value, breaking})}
                />
              </FormGroup>
            </Form>
            <Form fluid={true} style={{marginTop: '20px'}}>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.peering')}</ControlLabel>
                <Toggle checked={shared} onChange={shared => onChange?.({...value, shared})} />
                <HelpBlock>{t('articleEditor.panels.allowPeerPublishing')}</HelpBlock>
              </FormGroup>
            </Form>
            <ControlLabel>{t('articleEditor.panels.postImage')}</ControlLabel>
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
          </Panel>
        )
      case MetaDataType.Properties:
        return (
          <Panel>
            <ListInput
              value={metaDataProperties}
              defaultValue={{propertyKey: '', propertyValue: '', propertyIsPublic: true}}
              onChange={propertiesItemInput => setMetadataProperties(propertiesItemInput)}>
              {({value, onChange}) => (
                <Form layout="inline">
                  <FormGroup>
                    <FormControl
                      onChange={propertyKey => onChange({...value, propertyKey})}
                      value={value.propertyKey}
                      placeholder={t('articleEditor.panels.key')}
                      style={{width: '8rem'}}
                    />
                    <FormControl
                      onChange={propertyValue => onChange({...value, propertyValue})}
                      value={value.propertyValue}
                      placeholder={t('articleEditor.panels.value')}
                      style={{width: '8rem'}}
                    />
                  </FormGroup>
                  <FormGroup style={{paddingTop: '5px'}}>
                    <Toggle
                      checkedChildren="public"
                      unCheckedChildren="private"
                      checked={value.propertyIsPublic}
                      onChange={propertyIsPublic => onChange({...value, propertyIsPublic})}
                      value={value.propertyIsPublic}
                    />
                  </FormGroup>
                </Form>
              )}
            </ListInput>
          </Panel>
        )
      default:
        return <></>
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.metadata')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={activeKey}
          onSelect={activeKey => setActiveKey(activeKey)}
          style={{marginBottom: 20}}>
          <Nav.Item eventKey={MetaDataType.General} icon={<Icon icon="cog" />}>
            {t('articleEditor.panels.general')}
          </Nav.Item>
          <Nav.Item eventKey={MetaDataType.SocialMedia} icon={<Icon icon="share-alt" />}>
            {t('articleEditor.panels.socialMedia')}
          </Nav.Item>
          <Nav.Item eventKey={MetaDataType.Properties} icon={<Icon icon="list" />}>
            {t('articleEditor.panels.properties')}
          </Nav.Item>
        </Nav>
        {currentContent()}
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} onClick={() => onClose?.()}>
          {t('articleEditor.panels.saveAndClose')}
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
      {(value.image || value.socialMediaImage) && (
        <Drawer
          show={isEditModalOpen}
          size={'sm'}
          onHide={() => {
            setEditModalOpen(false)
          }}>
          <ImagedEditPanel
            id={activeKey === MetaDataType.General ? value.image?.id : value.socialMediaImage?.id}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  )
}
