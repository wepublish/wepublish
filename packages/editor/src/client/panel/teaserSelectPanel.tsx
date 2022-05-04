import React, {useEffect, useState} from 'react'

import {
  ArticleFilter,
  ArticleSort,
  SortOrder,
  useArticleListQuery,
  usePageListQuery,
  usePeerArticleListQuery
} from '../api'
import {TeaserType, TeaserLink} from '../blocks/types'

import {useTranslation} from 'react-i18next'
import {Button, Icon, Drawer, Nav, List, Input, InputGroup, Notification} from 'rsuite'

export interface TeaserSelectPanelProps {
  onClose(): void
  onSelect(teaserLink: TeaserLink): void
}

export function TeaserSelectPanel({onClose, onSelect}: TeaserSelectPanelProps) {
  const [type, setType] = useState<TeaserType>(TeaserType.Article)

  const [peerFilter, setPeerFilter] = useState<ArticleFilter>({title: ''})

  const [filter, setFilter] = useState('')

  // peer variables
  const peerListVariables = {
    peerFilter: filter || undefined,
    first: 20,
    order: SortOrder.Descending,
    sort: ArticleSort.PublishedAt
  }
  // article variables
  const listVariables = {filter: filter || undefined, first: 20}
  const {
    data: articleListData,
    fetchMore: fetchMoreArticles,
    error: articleListError
  } = useArticleListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })

  const {
    data: peerArticleListData,
    fetchMore: fetchMorePeerArticles,
    error: peerArticleListError
  } = usePeerArticleListQuery({
    variables: peerListVariables,
    fetchPolicy: 'network-only'
  })

  const {
    data: pageListData,
    fetchMore: fetchMorePages,
    error: pageListError
  } = usePageListQuery({
    variables: listVariables,
    fetchPolicy: 'no-cache'
  })

  const articles = articleListData?.articles.nodes ?? []
  const peerArticles = peerArticleListData?.peerArticles.nodes ?? []
  const pages = pageListData?.pages.nodes ?? []

  const {t} = useTranslation()

  useEffect(() => {
    if (articleListError ?? pageListError ?? peerArticleListError) {
      Notification.error({
        title: articleListError?.message ?? pageListError?.message ?? peerArticleListError!.message,
        duration: 5000
      })
    }
  }, [articleListError ?? pageListError ?? peerArticleListError])

  function loadMoreArticles() {
    fetchMoreArticles({
      variables: {...listVariables, after: articleListData?.articles.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          articles: {
            ...fetchMoreResult.articles,
            nodes: [...prev.articles.nodes, ...fetchMoreResult?.articles.nodes]
          }
        }
      }
    })
  }

  function loadMorePeerArticles() {
    fetchMorePeerArticles({
      variables: {
        ...peerListVariables,
        after: peerArticleListData?.peerArticles.pageInfo.endCursor
      },
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          peerArticles: {
            ...fetchMoreResult.peerArticles,
            nodes: [...prev.peerArticles.nodes, ...fetchMoreResult?.peerArticles.nodes]
          }
        }
      }
    })
  }

  function loadMorePages() {
    fetchMorePages({
      variables: {...listVariables, after: pageListData?.pages.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          pages: {
            ...fetchMoreResult.pages,
            nodes: [...prev.pages.nodes, ...fetchMoreResult?.pages.nodes]
          }
        }
      }
    })
  }

  function currentFilter() {
    switch (type) {
      case TeaserType.Article:
        return <Input value={filter} onChange={value => setFilter(value)} />
      case TeaserType.PeerArticle:
        return (
          <Input value={peerFilter.title || ''} onChange={value => setPeerFilter({title: value})} />
        )
      case TeaserType.Page:
        return <Input value={filter} onChange={value => setFilter(value)} />
    }
  }
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
                <List.Item key={article.id}>
                  <h3
                    style={{cursor: 'pointer'}}
                    onClick={() => onSelect({type: TeaserType.Article, article})}>
                    {article.latest.title || t('articleEditor.panels.untitled')}
                  </h3>
                  <div>
                    <div style={{display: 'inline', fontSize: 12}}>
                      {t('articleEditor.panels.createdAt', {
                        createdAt: new Date(article.createdAt)
                      })}
                    </div>
                    <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                      {t('articleEditor.panels.modifiedAt', {
                        modifiedAt: new Date(article.modifiedAt)
                      })}
                    </div>
                    <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                      {states.join(' / ')}
                    </div>
                  </div>
                </List.Item>
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
                <List.Item key={`${peer.id}.${article.id}`}>
                  <h3
                    style={{cursor: 'pointer'}}
                    onClick={() =>
                      onSelect({type: TeaserType.PeerArticle, peer, articleID: article.id, article})
                    }>
                    {peer.profile?.name ?? peer.name} -{' '}
                    {article.latest.title || t('articleEditor.panels.untitled')}
                  </h3>
                  <div>
                    <div style={{display: 'inline', fontSize: 12}}>
                      {t('articleEditor.panels.createdAt', {
                        createdAt: new Date(article.createdAt)
                      })}
                    </div>
                    <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                      {t('articleEditor.panels.modifiedAt', {
                        modifiedAt: new Date(article.modifiedAt)
                      })}
                    </div>
                    <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                      {states.join(' / ')}
                    </div>
                    <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                      <a href={peeredArticleURL} target="_blank" rel="noreferrer">
                        {t('articleEditor.panels.peeredArticlePreview')}{' '}
                        <Icon icon="external-link" />
                      </a>
                    </div>
                  </div>
                </List.Item>
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

              if (page.draft) states.push('articleEditor.panels.draft')
              if (page.pending) states.push('articleEditor.panels.pending')
              if (page.published) states.push('articleEditor.panels.published')

              return (
                <List.Item key={page.id}>
                  <h3
                    style={{cursor: 'pointer'}}
                    onClick={() => onSelect({type: TeaserType.Page, page})}>
                    {page.latest.title || t('articleEditor.panels.untitled')}
                  </h3>
                  <div>
                    <div style={{display: 'inline', fontSize: 12}}>
                      {t('pageEditor.panels.createdAt', {createdAt: new Date(page.createdAt)})}
                    </div>
                    <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                      {t('pageEditor.panels.modifiedAt', {modifiedAt: new Date(page.modifiedAt)})}
                    </div>
                    <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                      {states.join(' / ')}
                    </div>
                  </div>
                </List.Item>
              )
            })}
            {pageListData?.pages.pageInfo.hasNextPage && (
              <Button onClick={loadMorePages}>{t('articleEditor.panels.loadMore')}</Button>
            )}
          </>
        )
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.chooseTeaser')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={type}
          onSelect={type => setType(type)}
          style={{marginBottom: 20}}>
          <Nav.Item eventKey={TeaserType.Article} icon={<Icon icon="file-text" />}>
            {t('articleEditor.panels.article')}
          </Nav.Item>
          <Nav.Item eventKey={TeaserType.PeerArticle} icon={<Icon icon="file-text" />}>
            {t('articleEditor.panels.peerArticle')}
          </Nav.Item>
          <Nav.Item eventKey={TeaserType.Page} icon={<Icon icon="file-text" />}>
            {t('articleEditor.panels.page')}
          </Nav.Item>
        </Nav>

        <InputGroup style={{marginBottom: 20}}>
          {currentFilter()}
          <InputGroup.Addon>
            <Icon icon="search" />
          </InputGroup.Addon>
        </InputGroup>

        <List>{currentContent()}</List>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
