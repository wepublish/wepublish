import styled from '@emotion/styled'
import {AuthorRefFragment, CommentItemType, ImageRefFragment, TagType} from '@wepublish/editor/api'
import {slugify} from '@wepublish/utils'
import {useEffect, useState} from 'react'
import {Trans, useTranslation} from 'react-i18next'
import {MdAutoFixHigh, MdComment, MdListAlt, MdSettings, MdShare} from 'react-icons/md'
import {
  Button,
  Drawer,
  Form as RForm,
  IconButton,
  Input,
  InputGroup as RInputGroup,
  Message,
  Nav as RNav,
  Panel,
  Schema,
  Toggle as RToggle,
  Tooltip,
  Whisper
} from 'rsuite'
import {
  ChooseEditImage,
  CommentHistory,
  ListInput,
  ListValue,
  PermissionControl,
  SelectTags,
  Textarea,
  createCheckedPermissionComponent,
  useAuthorisation
} from '../atoms'
import {MetaDataType} from '../blocks'
import {generateID} from '../utility'
import {AuthorCheckPicker} from './authorCheckPicker'
import {ImageSelectPanel} from './imageSelectPanel'
import {ImageEditPanel} from './imageEditPanel'

const {Item} = RNav

const {Group, Control, ControlLabel, HelpText} = RForm

const InputGroup = styled(RInputGroup)`
  width: 100%;
`

const Nav = styled(RNav)`
  margin-bottom: 20px;
`

const Form = styled(RForm)`
  height: 100%;
`

const Toggle = styled(RToggle)`
  max-width: 70px;
  min-width: 70px;
`

const ValueInput = styled(Input)`
  width: 60%;
`

const KeyInput = styled(Input)`
  width: 40%;
  margin-right: 10px;
`

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`

const PaddingBottom = styled.div`
  padding-bottom: 20px;
`

const FloatRightLabel = styled.label`
  float: right;
`

const GoldLabel = styled.label`
  color: gold;
`

const FormGroup = styled(Group)`
  padding-top: 6px;
  padding-left: 8px;
`

export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface ArticleMetadata {
  readonly slug?: string | null
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
  readonly hidden?: boolean | null
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
  readonly articleID?: string
  readonly value: ArticleMetadata
  readonly infoData: InfoData

  onClose?(): void
  onChange?(value: ArticleMetadata): void
}

function ArticleMetadataPanel({
  articleID,
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
    hidden,
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

  const isAuthorized = useAuthorisation('CAN_CREATE_ARTICLE')

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
            <Group>
              <Message showIcon type="info">
                {t('pageEditor.panels.metadataInfo')}
              </Message>
            </Group>
            <Group controlId="socialMediaTitle">
              <ControlLabel>
                {t('articleEditor.panels.socialMediaTitle')}
                <FloatRightLabel>
                  {value.socialMediaTitle ? value.socialMediaTitle.length : 0}/{socialMediaTitleMax}
                </FloatRightLabel>
              </ControlLabel>
              <Control
                name="social-media-title"
                value={socialMediaTitle || ''}
                onChange={(socialMediaTitle: string) => {
                  onChange?.({...value, socialMediaTitle})
                }}
              />
              {value.socialMediaTitle && value.socialMediaTitle?.length > socialMediaTitleMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {
                    charCountWarning: socialMediaTitleMax
                  })}
                </GoldLabel>
              )}
            </Group>
            <Group controlId="socialMediaDescription">
              <ControlLabel>
                {t('articleEditor.panels.socialMediaDescription')}
                <FloatRightLabel>
                  {value.socialMediaDescription ? value.socialMediaDescription.length : 0}/
                  {socialMediaDescriptionMax}
                </FloatRightLabel>
              </ControlLabel>
              <Control
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
                  <GoldLabel>
                    {t('articleEditor.panels.charCountWarning', {
                      charCountWarning: socialMediaDescriptionMax
                    })}
                  </GoldLabel>
                )}
            </Group>
            <Group controlId="socialMediaAuthors">
              <ControlLabel>{t('articleEditor.panels.socialMediaAuthors')}</ControlLabel>
              <AuthorCheckPicker
                disabled={!isAuthorized}
                list={socialMediaAuthors}
                onChange={authors => onChange?.({...value, socialMediaAuthors: authors})}
              />
            </Group>
            <Group controlId="socialMediaImage">
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
            </Group>
          </Panel>
        )
      case MetaDataType.General:
        return (
          <Panel>
            <PaddingBottom>
              {t('articleEditor.panels.totalCharCount', {totalCharCount: infoData.charCount})}
            </PaddingBottom>
            <Group>
              <ControlLabel>
                {t('articleEditor.panels.preTitle')}
                <FloatRightLabel>
                  {value.preTitle.length}/{preTitleMax}{' '}
                </FloatRightLabel>
              </ControlLabel>
              <Control
                name="pre-title"
                className="preTitle"
                value={preTitle}
                onChange={(preTitle: string) => onChange?.({...value, preTitle})}
              />
              {value.preTitle.length > preTitleMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {charCountWarning: preTitleMax})}
                </GoldLabel>
              )}
            </Group>
            <Group controlId="articleTitle">
              <ControlLabel>
                {t('articleEditor.panels.title')}
                <FloatRightLabel>
                  {value.title.length}/{titleMax}{' '}
                </FloatRightLabel>
              </ControlLabel>
              <Control
                name="title"
                className="title"
                value={title}
                onChange={(title: string) => onChange?.({...value, title})}
              />
              <HelpText>{t('articleEditor.panels.titleHelpBlock')}</HelpText>
              {value.title.length > titleMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {charCountWarning: titleMax})}
                </GoldLabel>
              )}
            </Group>
            <Group controlId="articleLead">
              <ControlLabel>
                {t('articleEditor.panels.lead')}
                <FloatRightLabel>
                  {value.lead.length}/{leadMax}{' '}
                </FloatRightLabel>
              </ControlLabel>
              <Control
                name="lead"
                className="lead"
                rows={5}
                accepter={Textarea}
                value={lead}
                onChange={(lead: string) => {
                  onChange?.({...value, lead})
                }}
              />
              <HelpText>{t('articleEditor.panels.leadHelpBlock')}</HelpText>
              {value.lead.length > leadMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {charCountWarning: leadMax})}
                </GoldLabel>
              )}
            </Group>
            <Group controlId="articleSeoTitle">
              <ControlLabel>
                {t('articleEditor.panels.seoTitle')}
                <FloatRightLabel>
                  {value.seoTitle.length}/{seoTitleMax}{' '}
                </FloatRightLabel>
              </ControlLabel>
              <Control
                name="seo-title"
                className="seoTitle"
                value={seoTitle}
                onChange={(seoTitle: string) => onChange?.({...value, seoTitle})}
              />
              <HelpText>
                <Trans i18nKey={'articleEditor.panels.seoTitleHelpBlock'}>
                  text{' '}
                  <a
                    href="https://wepublish.ch/just-another-page/"
                    target="_blank"
                    rel="noreferrer">
                    more text
                  </a>
                </Trans>
              </HelpText>
              {value.seoTitle.length > seoTitleMax && (
                <GoldLabel>
                  {t('articleEditor.panels.charCountWarning', {charCountWarning: seoTitleMax})}
                </GoldLabel>
              )}
            </Group>
            <Group controlId="articleSlug">
              <ControlLabel>{t('articleEditor.panels.slug')}</ControlLabel>
              <InputGroup>
                <Control
                  name="slug"
                  className="slug"
                  value={slug}
                  onChange={(slug: string) => onChange?.({...value, slug})}
                  onBlur={() => onChange?.({...value, slug: slug ? slugify(slug) : null})}
                />
                <Whisper
                  placement="top"
                  trigger="hover"
                  speaker={<Tooltip>{t('articleEditor.panels.slugifySeoTitle')}</Tooltip>}>
                  <IconButton
                    icon={<MdAutoFixHigh />}
                    onClick={() => {
                      onChange?.({...value, title, slug: slugify(seoTitle)})
                    }}
                  />
                </Whisper>
              </InputGroup>
              <HelpText>
                {t('articleEditor.panels.dontChangeSlug')}{' '}
                <a
                  href="https://wepublish.ch/just-another-page-2/"
                  target="_blank"
                  rel="noreferrer">
                  {t('articleEditor.panels.slugGuide')}
                </a>
              </HelpText>
            </Group>
            <Group controlId="articleAuthors">
              <ControlLabel>{t('articleEditor.panels.authors')}</ControlLabel>
              <AuthorCheckPicker
                list={authors}
                disabled={!isAuthorized}
                onChange={authors => onChange?.({...value, authors})}
              />
            </Group>
            <Group>
              <ControlLabel>{t('articleEditor.panels.hideAuthors')}</ControlLabel>
              <Toggle
                className="hideAuthor"
                checked={hideAuthor}
                disabled={!isAuthorized}
                onChange={hideAuthor => onChange?.({...value, hideAuthor})}
              />
            </Group>
            <Group controlId="articleTags">
              <ControlLabel>{t('articleEditor.panels.tags')}</ControlLabel>
              <SelectTags
                disabled={!isAuthorized}
                selectedTags={tags}
                setSelectedTags={tagsValue => onChange?.({...value, tags: tagsValue ?? []})}
                tagType={TagType.Article}
              />
            </Group>
            <Group controlId="articleBreakingNews">
              <ControlLabel>{t('articleEditor.panels.breakingNews')}</ControlLabel>
              <Toggle
                className="breaking"
                disabled={!isAuthorized}
                checked={breaking}
                onChange={breaking => onChange?.({...value, breaking})}
              />
            </Group>
            <Group controlId="articleCanonicalUrl">
              <ControlLabel>{t('articleEditor.panels.canonicalUrl')}</ControlLabel>
              <Control
                name="canonicalUrl"
                className="canonicalUrl"
                placeholder={t('articleEditor.panels.urlPlaceholder')}
                value={canonicalUrl}
                onChange={(canonicalUrl: string) => onChange?.({...value, canonicalUrl})}
              />
              <HelpText>
                <Trans i18nKey={'articleEditor.panels.canonicalUrLHelpBlock'}>
                  text{' '}
                  <a
                    href="https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls"
                    target="_blank"
                    rel="noreferrer">
                    more text
                  </a>
                </Trans>
              </HelpText>
            </Group>

            <Group controlId="articlePeering">
              <ControlLabel>{t('articleEditor.panels.peering')}</ControlLabel>
              <Toggle
                checked={shared}
                disabled={!isAuthorized}
                onChange={shared => onChange?.({...value, shared})}
              />
              <HelpText>{t('articleEditor.panels.allowPeerPublishing')}</HelpText>
            </Group>

            <Group controlId="hidden">
              <ControlLabel>{t('articleEditor.panels.hidden')}</ControlLabel>
              <Toggle
                checked={hidden ?? false}
                disabled={!isAuthorized}
                onChange={hidden => onChange?.({...value, hidden})}
              />
              <HelpText>{t('articleEditor.panels.setAsHidden')}</HelpText>
            </Group>

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
            <Group>
              <Message showIcon type="info">
                {t('articleEditor.panels.propertiesInfo')}
              </Message>
            </Group>
            <Group controlId="articleProperties">
              <ControlLabel>{t('articleEditor.panels.properties')}</ControlLabel>
              <ListInput
                value={metaDataProperties}
                onChange={propertiesItemInput => setMetadataProperties(propertiesItemInput)}
                defaultValue={{key: '', value: '', public: true}}>
                {({value, onChange}) => (
                  <FlexRow>
                    <KeyInput
                      placeholder={t('articleEditor.panels.key')}
                      value={value.key}
                      onChange={propertyKey => onChange({...value, key: propertyKey})}
                    />
                    <ValueInput
                      placeholder={t('articleEditor.panels.value')}
                      value={value.value}
                      onChange={propertyValue => onChange({...value, value: propertyValue})}
                    />
                    <FormGroup controlId="articleProperty">
                      <Toggle
                        checkedChildren={t('articleEditor.panels.public')}
                        unCheckedChildren={t('articleEditor.panels.private')}
                        checked={value.public}
                        onChange={isPublic => onChange({...value, public: isPublic})}
                      />
                    </FormGroup>
                  </FlexRow>
                )}
              </ListInput>
            </Group>
          </Panel>
        )
      case MetaDataType.Comments:
        return (
          <Panel>
            {articleID && (
              <CommentHistory commentItemType={CommentItemType.Article} commentItemID={articleID} />
            )}
          </Panel>
        )
      default:
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <></>
    }
  }

  return (
    <Form fluid model={model} onSubmit={validationPassed => validationPassed && onClose?.()}>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.metadata')}</Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}>
            <Button appearance="primary" type="submit">
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
          <Item eventKey={MetaDataType.General} icon={<MdSettings />}>
            {t('articleEditor.panels.general')}
          </Item>
          <Item eventKey={MetaDataType.SocialMedia} icon={<MdShare />}>
            {t('articleEditor.panels.socialMedia')}
          </Item>
          <Item eventKey={MetaDataType.Properties} icon={<MdListAlt />}>
            {t('articleEditor.panels.properties')}
          </Item>
          {articleID && (
            <Item eventKey={MetaDataType.Comments} icon={<MdComment />}>
              {t('articleEditor.panels.comments')}
            </Item>
          )}
        </Nav>
        {currentContent()}
      </Drawer.Body>

      <Drawer
        open={isChooseModalOpen}
        size="sm"
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
    </Form>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_ARTICLES',
  'CAN_GET_ARTICLES',
  'CAN_DELETE_ARTICLE',
  'CAN_PUBLISH_ARTICLE',
  'CAN_CREATE_ARTICLE'
])(ArticleMetadataPanel)
export {CheckedPermissionComponent as ArticleMetadataPanel}
