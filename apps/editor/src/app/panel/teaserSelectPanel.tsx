import styled from '@emotion/styled'
import {
  ArticleFilter,
  ArticleSort,
  PageFilter,
  SortOrder,
  TeaserStyle,
  useArticleListQuery,
  usePageListQuery,
  usePeerArticleListLazyQuery
} from '@wepublish/editor/api'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  MdDashboard,
  MdDescription,
  MdFileCopy,
  MdPreview,
  MdSearch,
  MdSettings
} from 'react-icons/md'
import {
  Button,
  Drawer,
  FlexboxGrid,
  Form,
  Input,
  InputGroup as RInputGroup,
  List as RList,
  Nav as RNav,
  Notification,
  Panel,
  Radio,
  RadioGroup,
  toaster,
  Toggle as RToggle
} from 'rsuite'

import {ChooseEditImage} from '../atoms/chooseEditImage'
import {ListInput, ListValue} from '../atoms/listInput'
import {Teaser, TeaserLink, TeaserType} from '../blocks/types'
import {generateID} from '../utility'
import {ImageEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'
import {previewForTeaser, TeaserMetadataProperty} from './teaserEditPanel'

const List = styled(RList)`
  box-shadow: none;
`

const InputGroup = styled(RInputGroup)`
  margin-bottom: 20px;
`

const Nav = styled(RNav)`
  margin-bottom: 20px;
`

const Toggle = styled(RToggle)`
  max-width: 70px;
  min-width: 70px;
`

const ButtonWithMargin = styled(Button)`
  margin-left: 20px;
`

const InlineDivWithMargin = styled.div`
  display: inline;
  font-size: 12px;
  margin-left: 8px;
`

const InlineDiv = styled.div`
  display: inline;
  font-size: 12px;
`

const InputW60 = styled(Input)`
  width: 60%;
`

const InputW40 = styled(Input)`
  width: 40%;
  margin-right: 10px;
`

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`

const H3 = styled.h3`
  cursor: pointer;
`

const FormGroup = styled(Form.Group)`
  padding-top: 6px;
  padding-left: 8px;
`

export interface TeaserSelectPanelProps {
  onClose(): void
  onSelect(teaserLink: TeaserLink): void
}

export function TeaserSelectPanel({onClose, onSelect}: TeaserSelectPanelProps) {
  const initialTeaser = {
    style: TeaserStyle.Default,
    title: '',
    preTitle: '',
    lead: '',
    contentUrl: 'https://www.example.com',
    image: undefined
  } as Teaser

  const [type, setType] = useState<TeaserType>(TeaserType.Article)
  const [style, setStyle] = useState(initialTeaser.style)
  const [image, setImage] = useState(initialTeaser.image)
  const [preTitle, setPreTitle] = useState(initialTeaser.preTitle)
  const [contentUrl, setContentUrl] = useState('')
  const [title, setTitle] = useState(initialTeaser.title)
  const [lead, setLead] = useState(initialTeaser.lead)
  const [peerArticlesLoaded, setPeerArticlesLoaded] = useState<boolean>(false)

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [filter, setFilter] = useState<ArticleFilter>({title: '', published: true})
  const [metaDataProperties, setMetadataProperties] = useState<ListValue<TeaserMetadataProperty>[]>(
    initialTeaser.type === TeaserType.Custom && initialTeaser.properties
      ? initialTeaser.properties.map(metaDataProperty => ({
          id: generateID(),
          value: metaDataProperty
        }))
      : []
  )

  const peerListVariables = {
    filter: filter || undefined,
    first: 20,
    order: SortOrder.Descending,
    sort: ArticleSort.PublishedAt
  }
  const listVariables = {filter: filter || undefined, take: 20}
  const pageListVariables = {filter: filter as PageFilter, take: 20}

  const {
    data: articleListData,
    fetchMore: fetchMoreArticles,
    error: articleListError
  } = useArticleListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })

  const [
    getPeerArticles,
    {
      loading: loadingPeerArticles,
      error: peerArticleListError,
      data: peerArticleListData,
      fetchMore: fetchMorePeerArticles
    }
  ] = usePeerArticleListLazyQuery({
    variables: peerListVariables,
    fetchPolicy: 'network-only'
  })

  const {
    data: pageListData,
    fetchMore: fetchMorePages,
    error: pageListError
  } = usePageListQuery({
    variables: pageListVariables,
    fetchPolicy: 'no-cache'
  })

  const articles = articleListData?.articles.nodes ?? []
  const peerArticles = peerArticleListData?.peerArticles.nodes ?? []
  const pages = pageListData?.pages.nodes ?? []

  const {t} = useTranslation()

  useEffect(() => {
    if (articleListError ?? pageListError ?? peerArticleListError) {
      toaster.push(
        <Notification
          type="error"
          header={
            articleListError?.message ?? pageListError?.message ?? peerArticleListError!.message
          }
          duration={5000}
        />,
        {placement: 'topEnd'}
      )
    }
  }, [articleListError, pageListError, peerArticleListError])

  function loadMoreArticles() {
    fetchMoreArticles({
      variables: {...listVariables, cursor: articleListData?.articles.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          articles: {
            ...fetchMoreResult.articles,
            nodes: [...prev.articles.nodes, ...fetchMoreResult.articles.nodes]
          }
        }
      }
    })
  }

  function loadMorePeerArticles() {
    fetchMorePeerArticles({
      variables: {
        ...peerListVariables,
        cursor: peerArticleListData?.peerArticles.pageInfo.endCursor
      },
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          peerArticles: {
            ...fetchMoreResult.peerArticles,
            nodes: [...prev.peerArticles.nodes, ...fetchMoreResult.peerArticles.nodes]
          }
        }
      }
    })
  }

  function loadMorePages() {
    fetchMorePages({
      variables: {...listVariables, cursor: pageListData?.pages.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          pages: {
            ...fetchMoreResult.pages,
            nodes: [...prev.pages.nodes, ...fetchMoreResult.pages.nodes]
          }
        }
      }
    })
  }

  const updateFilter = (value: string) =>
    setFilter(oldFilter => ({
      ...oldFilter,
      title: value
    }))

  function currentContent() {
    switch (type) {
      case TeaserType.Article:
        return (
          <>
            {articles.map(article => {
              const states = []

              if (article.draft) states.push(t('articleEditor.panels.draft'))
              if (article.pending) states.push(t('articleEditor.panels.pending'))
              if (article.published) states.push(t('articleEditor.panels.published'))

              return (
                <RList.Item key={article.id}>
                  <H3 onClick={() => onSelect({type: TeaserType.Article, article})}>
                    {article.latest.title || t('articleEditor.panels.untitled')}
                  </H3>
                  <div>
                    <InlineDiv>
                      {t('articleEditor.panels.createdAt', {
                        createdAt: new Date(article.createdAt)
                      })}
                    </InlineDiv>
                    <InlineDivWithMargin>
                      {t('articleEditor.panels.modifiedAt', {
                        modifiedAt: new Date(article.modifiedAt)
                      })}
                    </InlineDivWithMargin>
                    <InlineDivWithMargin>{states.join(' / ')}</InlineDivWithMargin>
                  </div>
                </RList.Item>
              )
            })}
            {articleListData?.articles.pageInfo.hasNextPage && (
              <Button onClick={loadMoreArticles}>{t('articleEditor.panels.loadMore')}</Button>
            )}
          </>
        )

      case TeaserType.PeerArticle:
        return (
          <>
            {peerArticles.map(({peer, article, peeredArticleURL}) => {
              const states = []

              if (article.draft) states.push(t('articleEditor.panels.draft'))
              if (article.pending) states.push(t('articleEditor.panels.pending'))
              if (article.published) states.push(t('articleEditor.panels.published'))

              return (
                <RList.Item key={`${peer.id}.${article.id}`}>
                  <H3
                    onClick={() =>
                      onSelect({type: TeaserType.PeerArticle, peer, articleID: article.id, article})
                    }>
                    {peer.profile?.name ?? peer.name} -{' '}
                    {article.latest.title || t('articleEditor.panels.untitled')}
                  </H3>
                  <div>
                    <InlineDiv>
                      {t('articleEditor.panels.createdAt', {
                        createdAt: new Date(article.createdAt)
                      })}
                    </InlineDiv>
                    <InlineDivWithMargin>
                      {t('articleEditor.panels.modifiedAt', {
                        modifiedAt: new Date(article.modifiedAt)
                      })}
                    </InlineDivWithMargin>
                    <InlineDivWithMargin>{states.join(' / ')}</InlineDivWithMargin>
                    <InlineDivWithMargin>
                      <a href={peeredArticleURL} target="_blank" rel="noreferrer">
                        {t('articleEditor.panels.peeredArticlePreview')} <MdPreview />
                      </a>
                    </InlineDivWithMargin>
                  </div>
                </RList.Item>
              )
            })}
            {peerArticleListData?.peerArticles.pageInfo.hasNextPage && (
              <Button onClick={loadMorePeerArticles}>{t('articleEditor.panels.loadMore')}</Button>
            )}
          </>
        )

      case TeaserType.Page:
        return (
          <>
            {pages.map(page => {
              const states = []

              if (page.draft) states.push(t('articleEditor.panels.draft'))
              if (page.pending) states.push(t('articleEditor.panels.pending'))
              if (page.published) states.push(t('articleEditor.panels.published'))

              return (
                <RList.Item key={page.id}>
                  <H3 onClick={() => onSelect({type: TeaserType.Page, page})}>
                    {page.latest.title || t('articleEditor.panels.untitled')}
                  </H3>
                  <div>
                    <InlineDiv>
                      {t('pageEditor.panels.createdAt', {createdAt: new Date(page.createdAt)})}
                    </InlineDiv>
                    <InlineDivWithMargin>
                      {t('pageEditor.panels.modifiedAt', {modifiedAt: new Date(page.modifiedAt)})}
                    </InlineDivWithMargin>
                    <InlineDivWithMargin>{states.join(' / ')}</InlineDivWithMargin>
                  </div>
                </RList.Item>
              )
            })}
            {pageListData?.pages.pageInfo.hasNextPage && (
              <Button onClick={loadMorePages}>{t('articleEditor.panels.loadMore')}</Button>
            )}
          </>
        )

      case TeaserType.Custom:
        return (
          <>
            <FlexboxGrid justify="end">
              <Button
                appearance={'primary'}
                onClick={() => {
                  onSelect({
                    ...initialTeaser,
                    type: TeaserType.Custom,
                    style,
                    preTitle: preTitle || undefined,
                    title: title || undefined,
                    lead: lead || undefined,
                    contentUrl: contentUrl || undefined,
                    properties:
                      metaDataProperties.map(({value}) => {
                        return value
                      }) || undefined,
                    image
                  })
                }}>
                {t('articleEditor.panels.confirm')}
              </Button>
              <ButtonWithMargin appearance={'subtle'} onClick={() => onClose?.()}>
                {t('navigation.overview.cancel')}
              </ButtonWithMargin>
            </FlexboxGrid>

            {previewForTeaser(initialTeaser, t)}

            <Panel header={t('articleEditor.panels.displayOptions')}>
              <Form fluid>
                <Form.Group controlId="articleStyle">
                  <Form.ControlLabel>{t('articleEditor.panels.style')}</Form.ControlLabel>
                  <RadioGroup
                    inline
                    value={style}
                    onChange={teaserStyle => setStyle(teaserStyle as TeaserStyle)}>
                    <Radio value={TeaserStyle.Default}>{t('articleEditor.panels.default')}</Radio>
                    <Radio value={TeaserStyle.Light}>{t('articleEditor.panels.light')}</Radio>
                    <Radio value={TeaserStyle.Text}>{t('articleEditor.panels.text')}</Radio>
                  </RadioGroup>
                </Form.Group>
                <Form.Group controlId="articlePreTitle">
                  <Form.ControlLabel>{t('articleEditor.panels.preTitle')}</Form.ControlLabel>
                  <Form.Control
                    name="pre-title"
                    value={preTitle}
                    onChange={(preTitle: string) => setPreTitle(preTitle)}
                  />
                </Form.Group>
                <Form.Group controlId="articleTitle">
                  <Form.ControlLabel>{t('articleEditor.panels.title')}</Form.ControlLabel>
                  <Form.Control
                    name="title"
                    value={title}
                    onChange={(title: string) => setTitle(title)}
                  />
                </Form.Group>
                <Form.Group controlId="articleLead">
                  <Form.ControlLabel>{t('articleEditor.panels.lead')}</Form.ControlLabel>
                  <Form.Control
                    name="lead"
                    value={lead}
                    onChange={(lead: string) => setLead(lead)}
                  />
                </Form.Group>
                <Form.Group controlId="customTeaserContentUrl">
                  <Form.ControlLabel>{t('articleEditor.panels.contentUrl')}</Form.ControlLabel>
                  <Form.Control
                    name="content-url"
                    value={contentUrl}
                    onChange={(contentUrl: string) => setContentUrl(contentUrl)}
                  />
                </Form.Group>
                <Form.Group controlId="properties">
                  <Form.ControlLabel>{t('articleEditor.panels.properties')}</Form.ControlLabel>
                  <ListInput
                    value={metaDataProperties}
                    onChange={propertiesItemInput => setMetadataProperties(propertiesItemInput)}
                    defaultValue={{key: '', value: '', public: true}}>
                    {({value, onChange}) => (
                      <FlexRow>
                        <InputW40
                          placeholder={t('articleEditor.panels.key')}
                          value={value.key}
                          onChange={propertyKey => onChange({...value, key: propertyKey})}
                        />
                        <InputW60
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
                </Form.Group>
              </Form>
            </Panel>

            <ChooseEditImage
              image={image}
              disabled={false}
              openChooseModalOpen={() => setChooseModalOpen(true)}
              openEditModalOpen={() => setEditModalOpen(true)}
              removeImage={() => setImage(undefined)}
            />

            <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
              <ImageSelectPanel
                onClose={() => setChooseModalOpen(false)}
                onSelect={value => {
                  setChooseModalOpen(false)
                  setImage(value)
                }}
              />
            </Drawer>

            {image && (
              <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
                <ImageEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />
              </Drawer>
            )}
          </>
        )
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.chooseTeaser')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('articleEditor.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={type}
          onSelect={async type => {
            setType(type)
            if (type === TeaserType.PeerArticle && !peerArticlesLoaded) {
              setPeerArticlesLoaded(true)
              await getPeerArticles()
            }
          }}>
          <RNav.Item eventKey={TeaserType.Article} icon={<MdDescription />}>
            {t('articleEditor.panels.article')}
          </RNav.Item>
          <RNav.Item eventKey={TeaserType.PeerArticle} icon={<MdFileCopy />}>
            {t('articleEditor.panels.peerArticle')}
          </RNav.Item>
          <RNav.Item eventKey={TeaserType.Page} icon={<MdDashboard />}>
            {t('articleEditor.panels.page')}
          </RNav.Item>
          <RNav.Item eventKey={TeaserType.Custom} icon={<MdSettings />}>
            {t('articleEditor.panels.custom')}
          </RNav.Item>
        </Nav>

        {type !== TeaserType.Custom && (
          <InputGroup>
            <Input value={filter.title || ''} onChange={updateFilter} />
            <RInputGroup.Addon>
              <MdSearch />
            </RInputGroup.Addon>
          </InputGroup>
        )}

        <List>{currentContent()}</List>
      </Drawer.Body>
    </>
  )
}
