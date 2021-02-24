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
import {ImageSelectPanel} from './imageSelectPanel'
import {slugify} from '../utility'
import {useAuthorListQuery, AuthorRefFragment, ImageRefFragment} from '../api'

import {useTranslation} from 'react-i18next'
import {MetaDataType} from '../blocks/types'
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

export interface ArticleMetadataPanelProps {
  readonly value: ArticleMetadata

  onClose?(): void
  onChange?(value: ArticleMetadata): void
}

export function ArticleMetadataPanel({value, onClose, onChange}: ArticleMetadataPanelProps) {
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
    socialMediaImage
  } = value

  const [activeKey, setActiveKey] = useState(MetaDataType.General)

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

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

  const [foundAuthors, setFoundAuthors] = useState<AuthorRefFragment[]>([])
  const [authorsFilter, setAuthorsFilter] = useState('')

  const authorsVariables = {filter: authorsFilter || undefined, first: 10}
  const {data} = useAuthorListQuery({
    variables: authorsVariables,
    fetchPolicy: 'network-only'
  })

  const preTitleMax = 30;
  const seoTitleMax = 70;
  const leadMax = 350;
  const socialMediaTitleMax = 100;
  const socialMediaDescriptionMax = 140;

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
                <ControlLabel>{t('articleEditor.panels.socialMediaTitle')}</ControlLabel>
                <FormControl
                  value={socialMediaTitle}
                  onChange={socialMediaTitle => {
                    onChange?.({...value, socialMediaTitle})
                  }}
                />
                <div style={{textAlign: 'right'}}> {`${t("articleEditor.panels.charCount")} ${value.socialMediaTitle?.length}`} </div>
                { value.socialMediaTitle!.length > socialMediaTitleMax && (
                <div style={{textAlign: 'right', color: 'gold'}}>{`${t("articleEditor.panels.charCountWarning")} ${socialMediaTitleMax}`}</div>
                 ) }
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.socialMediaDescription')}</ControlLabel>
                <FormControl
                  rows={5}
                  componentClass="textarea"
                  value={socialMediaDescription}
                  onChange={socialMediaDescription => {
                    onChange?.({...value, socialMediaDescription})
                  }}
                />
                <div style={{textAlign: 'right'}}> {`${t("articleEditor.panels.charCount")} ${value.socialMediaDescription?.length}`} </div>
                { value.socialMediaDescription!.length > socialMediaDescriptionMax && (
                <div style={{textAlign: 'right', color: 'gold'}}>{`${t("articleEditor.panels.charCountWarning")} ${socialMediaDescriptionMax}`}</div>
                 ) }
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.socialMediaAuthors')}</ControlLabel>
                <CheckPicker
                  cleanable={true}
                  value={socialMediaAuthors?.map(socialMediaAuthor => socialMediaAuthor.id)}
                  data={foundAuthors.map(author => ({value: author.id, label: author.name}))}
                  onSearch={searchKeyword => setAuthorsFilter(searchKeyword)}
                  onChange={socialMediaAuthorIDs => {
                    const socialMediaAuthors = foundAuthors.filter(author =>
                      socialMediaAuthorIDs.includes(author.id)
                    )
                    onChange?.({...value, socialMediaAuthors})
                  }}
                  block
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
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.preTitle')}</ControlLabel>
                <FormControl
                  value={preTitle}
                  onChange={preTitle => onChange?.({...value, preTitle})}
                />
                <div style={{textAlign: 'right'}}> {`${t("articleEditor.panels.charCount")} ${value.preTitle.length}`} </div>
                { value.preTitle.length > preTitleMax && (
                <div style={{textAlign: 'right', color: 'gold'}}>{`${t("articleEditor.panels.charCountWarning")} ${preTitleMax}`}</div>
                 ) }
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.title')}</ControlLabel>
                <FormControl value={title} onChange={title => onChange?.({...value, title})} />
                <HelpBlock>{t('articleEditor.panels.titleHelpBlock')}</HelpBlock>
                <div style={{textAlign: 'right'}}> {`${t("articleEditor.panels.charCount")} ${value.title.length}`} </div>
                { value.title.length > seoTitleMax && (
                <div style={{textAlign: 'right', color: 'gold'}}>{`${t("articleEditor.panels.charCountWarning")} ${seoTitleMax}`}</div>
                 ) }
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.lead')}</ControlLabel>
                <FormControl
                  rows={5}
                  componentClass="textarea"
                  value={lead}
                  onChange={lead => {
                    onChange?.({...value, lead})
                  }}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.seoTitle')}</ControlLabel>
                <FormControl
                  value={seoTitle}
                  onChange={seoTitle => onChange?.({...value, seoTitle})}
                />
                <HelpBlock>{t('articleEditor.panels.seoTitleHelpBlock')}</HelpBlock>
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
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.lead')}</ControlLabel>
                <FormControl
                  rows={5}
                  componentClass="textarea"
                  value={lead}
                  onChange={lead => onChange?.({...value, lead})}
                />
                <HelpBlock>{t('articleEditor.panels.leadHelpBlock')}</HelpBlock>
                <div style={{textAlign: 'right'}}> {`${t("articleEditor.panels.charCount")} ${value.lead.length}`} </div>
                { value.lead.length > leadMax && (
                <div style={{textAlign: 'right', color: 'gold'}}>{`${t("articleEditor.panels.charCountWarning")} ${leadMax}`}</div>
                 ) }
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
      default:
        return <></>
    }
  }

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
        </Nav>
        {currentContent()}
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
