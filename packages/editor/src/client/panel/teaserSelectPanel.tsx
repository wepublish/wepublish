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
  Button
} from '@karma.run/ui'

import {
  useArticleListQuery,
  usePageListQuery,
  ArticleRefFragment,
  PeerRefFragment,
  PageRefFragment
} from '../api'
import {TeaserType} from '../blocks/types'

export interface ArticleTeaserLink {
  type: TeaserType.Article
  article: ArticleRefFragment
}

export interface PeerArticleTeaserLink {
  type: TeaserType.PeerArticle
  peer: PeerRefFragment
  article: ArticleRefFragment
}

export interface PageTeaserLink {
  type: TeaserType.Page
  page: PageRefFragment
}

export type TeaserLink = ArticleTeaserLink | PeerArticleTeaserLink | PageTeaserLink

export interface TeaserSelectPanelProps {
  onClose(): void
  onSelect(teaserLink: TeaserLink): void
}

export function TeaserSelectPanel({onClose, onSelect}: TeaserSelectPanelProps) {
  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [type, setType] = useState<TeaserType>(TeaserType.Article)
  const [filter, setFilter] = useState('')

  const listVariables = {filter: filter || undefined, first: 50}
  const {
    data: articleListData,
    fetchMore: fetchMoreArticles,
    error: articleListError
  } = useArticleListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })

  const {data: pageListData, error: pageListError} = usePageListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })

  const articles = articleListData?.articles.nodes ?? []
  const pages = pageListData?.pages.nodes ?? []

  useEffect(() => {
    if (articleListError ?? pageListError) {
      setErrorToastOpen(true)
      setErrorMessage(articleListError?.message ?? pageListError!.message)
    }
  }, [articleListError ?? pageListError])

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

  function currentContent() {
    switch (type) {
      case TeaserType.Article:
        return (
          <>
            {articles.map(article => {
              const states = []

              if (article.draft) states.push('Draft')
              if (article.pending) states.push('Pending')
              if (article.published) states.push('Published')

              return (
                <Box key={article.id} marginBottom={Spacing.Small}>
                  <Box marginBottom={Spacing.Tiny}>
                    {props => (
                      // TODO: Clickable
                      <div
                        {...props}
                        style={{cursor: 'pointer'}}
                        onClick={() => onSelect({type: TeaserType.Article, article})}>
                        <Typography variant="body2" color={article.latest.title ? 'dark' : 'gray'}>
                          {article.latest.title || 'Untitled'}
                        </Typography>
                      </div>
                    )}
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
                        {article.latest.updatedAt &&
                          new Date(article.latest.updatedAt).toLocaleString()}
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
                <Button label="Load More" onClick={loadMoreArticles} />
              )}
            </Box>
          </>
        )

      case TeaserType.PeerArticle:
        return null

      case TeaserType.Page:
        return pages.map(page => {
          const states = []

          if (page.draft) states.push('Draft')
          if (page.pending) states.push('Pending')
          if (page.published) states.push('Published')

          return (
            <Box key={page.id} marginBottom={Spacing.Small}>
              <Box marginBottom={Spacing.Tiny}>
                {props => (
                  // TODO: Clickable
                  <div
                    {...props}
                    style={{cursor: 'pointer'}}
                    onClick={() => onSelect({type: TeaserType.Page, page})}>
                    <Typography variant="body2" color={page.latest.title ? 'dark' : 'gray'}>
                      {page.latest.title || 'Untitled'}
                    </Typography>
                  </div>
                )}
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
                    {page.latest.updatedAt && new Date(page.latest.updatedAt).toLocaleString()}
                  </Box>
                </Typography>
                <Typography element="div" variant="subtitle1" color="gray">
                  {states.join(' / ')}
                </Typography>
              </Box>
              <Divider />
            </Box>
          )
        })
    }
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Choose Teaser"
          leftChildren={
            <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose()} />
          }
        />
        <PanelSection>
          <Box display="flex" marginBottom={Spacing.Small}>
            {/* TODO: Create TabButton/ButtonGroup UI component */}
            <Button
              flexGrow={1}
              marginRight={Spacing.ExtraSmall}
              variant={type === TeaserType.Article ? 'default' : 'outlined'}
              label="Article"
              onClick={() => setType(TeaserType.Article)}
            />
            <Button
              flexGrow={1}
              marginRight={Spacing.ExtraSmall}
              variant={type === TeaserType.PeerArticle ? 'default' : 'outlined'}
              label="Peer Article"
              onClick={() => setType(TeaserType.PeerArticle)}
            />
            <Button
              flexGrow={1}
              marginRight={Spacing.ExtraSmall}
              variant={type === TeaserType.Page ? 'default' : 'outlined'}
              label="Page"
              onClick={() => setType(TeaserType.Page)}
            />
          </Box>
          <Box marginBottom={Spacing.Medium}>
            <SearchInput
              placeholder="Search"
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
