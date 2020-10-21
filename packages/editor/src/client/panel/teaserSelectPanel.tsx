import React, {useEffect, useState} from 'react'
import {MaterialIconClose, MaterialIconUpdate, MaterialIconQueryBuilder} from '@karma.run/icons'

import {
  Box,
  NavigationButton,
  Panel,
  PanelHeader,
  PanelSection,
  Toast,
  Spacing,
  Divider,
  Typography,
  Icon,
  IconScale,
  SearchInput,
  Button,
  Chip
} from '@karma.run/ui'

import {useArticleListQuery, usePageListQuery, usePeerArticleListQuery} from '../api'
import {TeaserType, TeaserLink} from '../blocks/types'

import {useTranslation} from 'react-i18next'

export interface TeaserSelectPanelProps {
  onClose(): void
  onSelect(teaserLink: TeaserLink): void
}

export function TeaserSelectPanel({onClose, onSelect}: TeaserSelectPanelProps) {
  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [type, setType] = useState<TeaserType>(TeaserType.Article)
  const [filter, setFilter] = useState('')

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
    variables: listVariables,
    fetchPolicy: 'network-only'
  })

  const {data: pageListData, fetchMore: fetchMorePages, error: pageListError} = usePageListQuery({
    variables: listVariables,
    fetchPolicy: 'no-cache'
  })

  const articles = articleListData?.articles.nodes ?? []
  const peerArticles = peerArticleListData?.peerArticles.nodes ?? []
  const pages = pageListData?.pages.nodes ?? []

  const {t} = useTranslation()

  useEffect(() => {
    if (articleListError ?? pageListError ?? peerArticleListError) {
      setErrorToastOpen(true)
      setErrorMessage(
        articleListError?.message ?? pageListError?.message ?? peerArticleListError!.message
      )
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
      variables: {...listVariables, after: peerArticleListData?.peerArticles.pageInfo.endCursor},
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
                <Box key={article.id} marginBottom={Spacing.Small}>
                  <Box
                    marginBottom={Spacing.Tiny}
                    style={{cursor: 'pointer'}}
                    onClick={() => onSelect({type: TeaserType.Article, article})}>
                    <Typography variant="body2" color={article.latest.title ? 'dark' : 'gray'}>
                      {article.latest.title || t('articleEditor.panels.untitled')}
                    </Typography>
                  </Box>
                  <Box
                    marginBottom={Spacing.ExtraSmall}
                    flexDirection="row"
                    alignItems="center"
                    display="flex">
                    <Typography element="div" variant="subtitle1" color="grayDark">
                      <Box
                        marginRight={Spacing.ExtraSmall}
                        flexDirection="row"
                        alignItems="center"
                        display="flex">
                        <Box marginRight={Spacing.Tiny}>
                          <Icon element={MaterialIconQueryBuilder} scale={IconScale.Larger} />
                        </Box>
                        {new Date(article.createdAt).toLocaleString()}
                      </Box>
                    </Typography>
                    <Typography element="div" variant="subtitle1" color="grayDark">
                      <Box
                        marginRight={Spacing.Small}
                        flexDirection="row"
                        alignItems="center"
                        display="flex">
                        <Box marginRight={Spacing.Tiny}>
                          <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
                        </Box>
                        {new Date(article.modifiedAt).toLocaleString()}
                      </Box>
                    </Typography>
                    <Typography element="div" variant="subtitle1" color="gray">
                      {states.join(' / ')}
                    </Typography>
                  </Box>
                  <Divider />
                </Box>
              )
            })}
            <Box display="flex" justifyContent="center">
              {articleListData?.articles.pageInfo.hasNextPage && (
                <Button label={t('articleEditor.panels.loadMore')} onClick={loadMoreArticles} />
              )}
            </Box>
          </>
        )

      case TeaserType.PeerArticle:
        return (
          <>
            {peerArticles.map(({peer, article}) => {
              const states = []

              if (article.draft) states.push(t('articleEditor.panels.draft'))
              if (article.pending) states.push(t('articleEditor.panels.pending'))
              if (article.published) states.push(t('articleEditor.panels.published'))

              return (
                <Box key={`${peer.id}.${article.id}`} marginBottom={Spacing.Small}>
                  <Box
                    marginBottom={Spacing.Tiny}
                    style={{cursor: 'pointer'}}
                    onClick={() =>
                      onSelect({type: TeaserType.PeerArticle, peer, articleID: article.id, article})
                    }>
                    <Typography variant="body2" color={article.latest.title ? 'dark' : 'gray'}>
                      {article.latest.title || t('articleEditor.panels.untitled')}
                    </Typography>
                  </Box>
                  <Box
                    marginBottom={Spacing.ExtraSmall}
                    flexDirection="row"
                    alignItems="center"
                    display="flex">
                    <Typography element="div" variant="subtitle1" color="grayDark">
                      <Box
                        marginRight={Spacing.ExtraSmall}
                        flexDirection="row"
                        alignItems="center"
                        display="flex">
                        <Box marginRight={Spacing.Tiny}>
                          <Icon element={MaterialIconQueryBuilder} scale={IconScale.Larger} />
                        </Box>
                        {new Date(article.createdAt).toLocaleString()}
                      </Box>
                    </Typography>
                    <Typography element="div" variant="subtitle1" color="grayDark">
                      <Box
                        marginRight={Spacing.Small}
                        flexDirection="row"
                        alignItems="center"
                        display="flex">
                        <Box marginRight={Spacing.Tiny}>
                          <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
                        </Box>
                        {new Date(article.modifiedAt).toLocaleString()}
                      </Box>
                    </Typography>
                    <Typography element="div" variant="subtitle1" color="gray">
                      {states.join(' / ')}
                    </Typography>
                  </Box>
                  <Box display="flex" marginBottom={Spacing.ExtraSmall}>
                    <Chip
                      imageURL={peer.profile?.logo?.squareURL ?? undefined}
                      label={peer.profile?.name ?? peer.name}
                    />
                  </Box>
                  <Divider />
                </Box>
              )
            })}
            <Box display="flex" justifyContent="center">
              {peerArticleListData?.peerArticles.pageInfo.hasNextPage && (
                <Button label={t('articleEditor.panels.loadMore')} onClick={loadMorePeerArticles} />
              )}
            </Box>
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
                <Box key={page.id} marginBottom={Spacing.Small}>
                  <Box
                    marginBottom={Spacing.Tiny}
                    style={{cursor: 'pointer'}}
                    onClick={() => onSelect({type: TeaserType.Page, page})}>
                    <Typography variant="body2" color={page.latest.title ? 'dark' : 'gray'}>
                      {page.latest.title || t('articleEditor.panels.untitled')}
                    </Typography>
                  </Box>
                  <Box
                    marginBottom={Spacing.ExtraSmall}
                    flexDirection="row"
                    alignItems="center"
                    display="flex">
                    <Typography element="div" variant="subtitle1" color="grayDark">
                      <Box
                        marginRight={Spacing.ExtraSmall}
                        flexDirection="row"
                        alignItems="center"
                        display="flex">
                        <Box marginRight={Spacing.Tiny}>
                          <Icon element={MaterialIconQueryBuilder} scale={IconScale.Larger} />
                        </Box>
                        {new Date(page.createdAt).toLocaleString()}
                      </Box>
                    </Typography>
                    <Typography element="div" variant="subtitle1" color="grayDark">
                      <Box
                        marginRight={Spacing.Small}
                        flexDirection="row"
                        alignItems="center"
                        display="flex">
                        <Box marginRight={Spacing.Tiny}>
                          <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
                        </Box>
                        {page.modifiedAt && new Date(page.modifiedAt).toLocaleString()}
                      </Box>
                    </Typography>
                    <Typography element="div" variant="subtitle1" color="gray">
                      {states.join(' / ')}
                    </Typography>
                  </Box>
                  <Divider />
                </Box>
              )
            })}
            <Box display="flex" justifyContent="center">
              {pageListData?.pages.pageInfo.hasNextPage && (
                <Button label={t('articleEditor.panels.loadMore')} onClick={loadMorePages} />
              )}
            </Box>
          </>
        )
    }
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('articleEditor.panels.chooseTeaser')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('articleEditor.panels.close')}
              onClick={() => onClose()}
            />
          }
        />
        <PanelSection>
          <Box display="flex" marginBottom={Spacing.Small}>
            {/* TODO: Create TabButton/ButtonGroup UI component */}
            <Button
              flexGrow={1}
              marginRight={Spacing.ExtraSmall}
              variant={
                type === TeaserType.Article
                  ? t('articleEditor.panels.default')
                  : t('articleEditor.panels.outlined')
              }
              label={t('articleEditor.panels.article')}
              onClick={() => setType(TeaserType.Article)}
            />
            <Button
              flexGrow={1}
              marginRight={Spacing.ExtraSmall}
              variant={
                type === TeaserType.PeerArticle
                  ? t('articleEditor.panels.default')
                  : t('articleEditor.panels.outlined')
              }
              label={t('articleEditor.panels.peerArticle')}
              onClick={() => setType(TeaserType.PeerArticle)}
            />
            <Button
              flexGrow={1}
              marginRight={Spacing.ExtraSmall}
              variant={
                type === TeaserType.Page
                  ? t('articleEditor.panels.default')
                  : t('articleEditor.panels.outlined')
              }
              label={t('articleEditor.panels.page')}
              onClick={() => setType(TeaserType.Page)}
            />
          </Box>
          <Box marginBottom={Spacing.Medium}>
            <SearchInput
              placeholder={t('articleEditor.panels.search')}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </Box>

          {currentContent()}
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
