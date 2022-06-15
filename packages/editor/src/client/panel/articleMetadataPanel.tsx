import React, {useEffect, useState} from 'react'

import {
  Button,
  Drawer,
  Form,
  TagPicker,
  Toggle,
  Nav,
  Panel,
  Message,
  InputGroup,
  IconButton,
  Tooltip,
  Whisper,
  Input,
  Schema
} from 'rsuite'

import {ImagedEditPanel} from './imageEditPanel'
import {AuthorCheckPicker} from './authorCheckPicker'
import {ImageSelectPanel} from './imageSelectPanel'
import {generateID, slugify} from '../utility'
import {AuthorRefFragment, ImageRefFragment} from '../api'

import {useTranslation, Trans} from 'react-i18next'
import {MetaDataType} from '../blocks/types'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {ListInput, ListValue} from '../atoms/listInput'
import CogIcon from '@rsuite/icons/legacy/Cog'
import ListIcon from '@rsuite/icons/legacy/List'
import ShareAltIcon from '@rsuite/icons/legacy/ShareAlt'
import MagicIcon from '@rsuite/icons/legacy/Magic'
import {Textarea} from '../atoms/textarea'

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
  readonly seoTitle: string
  readonly authors: AuthorRefFragment[]
  readonly tags: string[]
  readonly url: string
  readonly properties: ArticleMetadataProperty[]
  readonly canonicalUrl: string
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
    canonicalUrl,
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
  >(
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
      }
    }
  }

  const preTitleMax = 30
  const seoTitleMax = 70
  const titleMax = 140
  const leadMax = 350
  const socialMediaTitleMax = 100
  const socialMediaDescriptionMax = 140

  // Defines field requirements
  const {StringType} = Schema.Types
  const model = Schema.Model({
    canonicalUrl: StringType().isURL(t('errorMessages.invalidUrlErrorMessage'))
  })

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.SocialMedia:
        return (
          <Panel>
            <Form.Group>
              <Message showIcon type="info">
                {t('pageEditor.panels.metadataInfo')}
              </Message>
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>
                {t('articleEditor.panels.socialMediaTitle')}
                <label style={{float: 'right'}}>
                  {' '}
                  {value.socialMediaTitle ? value.socialMediaTitle.length : 0}/{socialMediaTitleMax}
                </label>
              </Form.ControlLabel>
              <Form.Control
                name="social-media-title"
                value={socialMediaTitle || ''}
                onChange={(socialMediaTitle: string) => {
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
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>
                {t('articleEditor.panels.socialMediaDescription')}
                <label style={{float: 'right'}}>
                  {' '}
                  {value.socialMediaDescription ? value.socialMediaDescription.length : 0}/
                  {socialMediaDescriptionMax}
                </label>
              </Form.ControlLabel>
              <Form.Control
                name="social-media-description"
                rows={5}
                accepter={Textarea}
                value={socialMediaDescription || ''}
                onChange={(socialMediaDescription: string) => {
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
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.socialMediaAuthors')}</Form.ControlLabel>
              <AuthorCheckPicker
                list={socialMediaAuthors}
                onChange={authors => onChange?.({...value, socialMediaAuthors: authors})}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.socialMediaImage')}</Form.ControlLabel>
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
            {/* </Form> */}
          </Panel>
        )
      case MetaDataType.General:
        return (
          <Panel>
            <div style={{paddingBottom: '20px'}}>
              {t('articleEditor.panels.totalCharCount', {totalCharCount: infoData.charCount})}
            </div>
            <Form.Group>
              <Form.ControlLabel>
                {t('articleEditor.panels.preTitle')}
                <label style={{float: 'right'}}>
                  {' '}
                  {value.preTitle.length}/{preTitleMax}{' '}
                </label>
              </Form.ControlLabel>
              <Form.Control
                name="pre-title"
                className="preTitle"
                value={preTitle}
                onChange={(preTitle: string) => onChange?.({...value, preTitle})}
              />
              {value.preTitle.length > preTitleMax && (
                <label style={{color: 'gold'}}>
                  {t('articleEditor.panels.charCountWarning', {charCountWarning: preTitleMax})}
                </label>
              )}
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>
                {t('articleEditor.panels.title')}
                <label style={{float: 'right'}}>
                  {' '}
                  {value.title.length}/{titleMax}{' '}
                </label>
              </Form.ControlLabel>
              <Form.Control
                name="title"
                className="title"
                value={title}
                onChange={(title: string) => onChange?.({...value, title})}
              />
              <Form.HelpText>{t('articleEditor.panels.titleHelpBlock')}</Form.HelpText>
              {value.title.length > titleMax && (
                <label style={{color: 'gold'}}>
                  {t('articleEditor.panels.charCountWarning', {charCountWarning: titleMax})}
                </label>
              )}
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>
                {t('articleEditor.panels.lead')}
                <label style={{float: 'right'}}>
                  {' '}
                  {value.lead.length}/{leadMax}{' '}
                </label>
              </Form.ControlLabel>
              <Form.Control
                name="lead"
                className="lead"
                rows={5}
                accepter={Textarea}
                value={lead}
                onChange={(lead: string) => {
                  onChange?.({...value, lead})
                }}
              />
              <Form.HelpText>{t('articleEditor.panels.leadHelpBlock')}</Form.HelpText>
              {value.lead.length > leadMax && (
                <label style={{color: 'gold'}}>
                  {t('articleEditor.panels.charCountWarning', {charCountWarning: leadMax})}
                </label>
              )}
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>
                {t('articleEditor.panels.seoTitle')}
                <label style={{float: 'right'}}>
                  {' '}
                  {value.seoTitle.length}/{seoTitleMax}{' '}
                </label>
              </Form.ControlLabel>
              <Form.Control
                name="seo-title"
                className="seoTitle"
                value={seoTitle}
                onChange={(seoTitle: string) => onChange?.({...value, seoTitle})}
              />
              <Form.HelpText>
                <Trans i18nKey={'articleEditor.panels.seoTitleHelpBlock'}>
                  text{' '}
                  <a
                    href="https://wepublish.ch/just-another-page/"
                    target="_blank"
                    rel="noreferrer">
                    more text
                  </a>
                </Trans>
              </Form.HelpText>
              {value.seoTitle.length > seoTitleMax && (
                <label style={{color: 'gold'}}>
                  {t('articleEditor.panels.charCountWarning', {charCountWarning: seoTitleMax})}
                </label>
              )}
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.slug')}</Form.ControlLabel>
              <InputGroup style={{width: '100%'}}>
                <Form.Control
                  name="slug"
                  className="slug"
                  value={slug}
                  onChange={(slug: string) => onChange?.({...value, slug})}
                  onBlur={() => onChange?.({...value, slug: slugify(slug)})}
                />
                <Whisper
                  placement="top"
                  trigger="hover"
                  speaker={<Tooltip>{t('articleEditor.panels.slugifySeoTitle')}</Tooltip>}>
                  <IconButton
                    icon={<MagicIcon />}
                    onClick={() => {
                      onChange?.({...value, title, slug: slugify(seoTitle)})
                    }}
                  />
                </Whisper>
              </InputGroup>
              <Form.HelpText>
                <Trans i18nKey={'articleEditor.panels.dontChangeSlug'}>
                  text{' '}
                  <a
                    href="https://wepublish.ch/just-another-page-2/"
                    target="_blank"
                    rel="noreferrer"></a>
                </Trans>
              </Form.HelpText>
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.authors')}</Form.ControlLabel>
              <AuthorCheckPicker
                list={authors}
                onChange={authors => onChange?.({...value, authors})}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.hideAuthors')}</Form.ControlLabel>
              <Toggle
                className="hideAuthor"
                checked={hideAuthor}
                onChange={hideAuthor => onChange?.({...value, hideAuthor})}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.tags')}</Form.ControlLabel>
              <TagPicker
                block
                virtualized
                value={tags}
                creatable
                data={tags.map(tag => ({label: tag, value: tag}))}
                onChange={tagsValue => onChange?.({...value, tags: tagsValue ?? []})}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.breakingNews')}</Form.ControlLabel>
              <Toggle
                className="breaking"
                checked={breaking}
                onChange={breaking => onChange?.({...value, breaking})}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.canonicalUrl')}</Form.ControlLabel>
              <Form.Control
                name="canonicalUrl"
                className="canonicalUrl"
                placeholder={t('articleEditor.panels.urlPlaceholder')}
                value={canonicalUrl}
                onChange={(canonicalUrl: string) => onChange?.({...value, canonicalUrl})}
              />
              <Form.HelpText>
                <Trans i18nKey={'articleEditor.panels.canonicalUrLHelpBlock'}>
                  text{' '}
                  <a
                    href="https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls"
                    target="_blank"
                    rel="noreferrer">
                    more text
                  </a>
                </Trans>
              </Form.HelpText>
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.peering')}</Form.ControlLabel>
              <Toggle checked={shared} onChange={shared => onChange?.({...value, shared})} />
              <Form.HelpText>{t('articleEditor.panels.allowPeerPublishing')}</Form.HelpText>
            </Form.Group>
            <Form.ControlLabel>{t('articleEditor.panels.postImage')}</Form.ControlLabel>
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
            <Form.Group>
              <Message showIcon type="info">
                {t('articleEditor.panels.propertiesInfo')}
              </Message>
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.properties')}</Form.ControlLabel>
              <ListInput
                value={metaDataProperties}
                onChange={propertiesItemInput => setMetadataProperties(propertiesItemInput)}
                defaultValue={{key: '', value: '', public: true}}>
                {({value, onChange}) => (
                  <div style={{display: 'flex', flexDirection: 'row'}}>
                    <Input
                      placeholder={t('articleEditor.panels.key')}
                      style={{
                        width: '40%',
                        marginRight: '10px'
                      }}
                      value={value.key}
                      onChange={propertyKey => onChange({...value, key: propertyKey})}
                    />
                    <Input
                      placeholder={t('articleEditor.panels.value')}
                      style={{
                        width: '60%'
                      }}
                      value={value.value}
                      onChange={propertyValue => onChange({...value, value: propertyValue})}
                    />
                    <Form.Group style={{paddingTop: '6px', paddingLeft: '8px'}}>
                      <Toggle
                        style={{maxWidth: '70px', minWidth: '70px'}}
                        checkedChildren={t('articleEditor.panels.public')}
                        unCheckedChildren={t('articleEditor.panels.private')}
                        checked={value.public}
                        onChange={isPublic => onChange({...value, public: isPublic})}
                      />
                    </Form.Group>
                  </div>
                )}
              </ListInput>
            </Form.Group>
          </Panel>
        )
      default:
        return <></>
    }
  }

  return (
    <>
      <Form
        fluid
        model={model}
        onSubmit={validationPassed => validationPassed && onClose?.()}
        style={{height: '100%'}}>
        <Drawer.Header>
          <Drawer.Title>{t('articleEditor.panels.metadata')}</Drawer.Title>

          <Drawer.Actions>
            <Button appearance="primary" type="submit">
              {t('articleEditor.panels.saveAndClose')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <Nav
            appearance="tabs"
            activeKey={activeKey}
            onSelect={activeKey => setActiveKey(activeKey)}
            style={{marginBottom: 20}}>
            <Nav.Item eventKey={MetaDataType.General} icon={<CogIcon />}>
              {t('articleEditor.panels.general')}
            </Nav.Item>
            <Nav.Item eventKey={MetaDataType.SocialMedia} icon={<ShareAltIcon />}>
              {t('articleEditor.panels.socialMedia')}
            </Nav.Item>
            <Nav.Item eventKey={MetaDataType.Properties} icon={<ListIcon />}>
              {t('articleEditor.panels.properties')}
            </Nav.Item>
          </Nav>
          {currentContent()}
        </Drawer.Body>

        <Drawer
          open={isChooseModalOpen}
          size={'sm'}
          onClose={() => {
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
            open={isEditModalOpen}
            size={'sm'}
            onClose={() => {
              setEditModalOpen(false)
            }}>
            <ImagedEditPanel
              id={activeKey === MetaDataType.General ? value.image?.id : value.socialMediaImage?.id}
              onClose={() => setEditModalOpen(false)}
            />
          </Drawer>
        )}
      </Form>
    </>
  )
}
