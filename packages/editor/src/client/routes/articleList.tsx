import React, {useState} from 'react'

import {
  MaterialIconQueryBuilder,
  MaterialIconUpdate,
  MaterialIconDeleteOutlined,
  MaterialIconGetAppOutlined,
  MaterialIconClose,
  MaterialIconCheck
} from '@karma.run/icons'

import {
  Typography,
  Box,
  Spacing,
  Divider,
  Icon,
  IconScale,
  SearchInput,
  OptionButton,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  Button
} from '@karma.run/ui'

import {RouteLinkButton, ArticleCreateRoute, Link, ArticleEditRoute} from '../route'

import {
  useArticleListQuery,
  ArticleRefFragment,
  useUnpublishArticleMutation,
  useDeleteArticleMutation,
  ArticleListDocument,
  ArticleListQuery
} from '../api'

import {useTranslation} from 'react-i18next'

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
}

const ArticlesPerPage = 50

export function ArticleList() {
  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<ArticleRefFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [deleteArticle, {loading: isDeleting}] = useDeleteArticleMutation()
  const [unpublishArticle, {loading: isUnpublishing}] = useUnpublishArticleMutation()

  const listVariables = {filter: filter || undefined, first: ArticlesPerPage}
  const {data, fetchMore, loading: isLoading} = useArticleListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })
  const {t} = useTranslation()

  function loadMore() {
    fetchMore({
      variables: {...listVariables, after: data?.articles.pageInfo.endCursor},
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

  const articles = data?.articles.nodes.map(article => {
    const {
      id,
      createdAt,
      modifiedAt,

      draft,
      pending,
      published,

      latest: {title}
    } = article

    const states = []

    if (draft) states.push(t('articles.overview.draft'))
    if (pending) states.push(t('articles.overview.pending'))
    if (published) states.push(t('articles.overview.published'))

    return (
      <Box key={id} marginBottom={Spacing.Small}>
        <Box marginBottom={Spacing.ExtraSmall}>
          <Link route={ArticleEditRoute.create({id})}>
            <Typography variant="h3" color={title ? 'dark' : 'gray'}>
              {title || t('articles.overview.untitled')}
            </Typography>
          </Link>
        </Box>
        <Box
          marginBottom={Spacing.ExtraSmall}
          flexDirection="row"
          alignItems="center"
          display="flex">
          <Typography element="div" variant="body1" color="grayDark">
            <Box
              marginRight={Spacing.ExtraSmall}
              flexDirection="row"
              alignItems="center"
              display="flex">
              <Box marginRight={Spacing.Tiny}>
                <Icon element={MaterialIconQueryBuilder} scale={IconScale.Larger} />
              </Box>
              {new Date(createdAt).toLocaleString()}
            </Box>
          </Typography>
          <Typography element="div" variant="body1" color="grayDark">
            <Box marginRight={Spacing.Small} flexDirection="row" alignItems="center" display="flex">
              <Box marginRight={Spacing.Tiny}>
                <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
              </Box>
              {new Date(modifiedAt).toLocaleString()}
            </Box>
          </Typography>
          <Typography element="div" variant="subtitle1" color="gray">
            {states.join(' / ')}
          </Typography>
          <Box flexGrow={1} />
          <OptionButton
            position="left"
            menuItems={
              published // TODO: Allow disabling menu items
                ? [
                    {
                      id: ConfirmAction.Unpublish,
                      label: t('articles.panels.unpublish'),
                      icon: MaterialIconGetAppOutlined
                    },
                    {
                      id: ConfirmAction.Delete,
                      label: t('articles.panels.delete'),
                      icon: MaterialIconDeleteOutlined
                    }
                  ]
                : [
                    {
                      id: ConfirmAction.Delete,
                      label: t('articles.panels.delete'),
                      icon: MaterialIconDeleteOutlined
                    }
                  ]
            }
            onMenuItemClick={item => {
              setCurrentArticle(article)
              setConfirmationDialogOpen(true)
              setConfirmAction(item.id as ConfirmAction)
            }}
          />
        </Box>
        <Divider />
      </Box>
    )
  })

  return (
    <>
      <Box marginBottom={Spacing.Small} flexDirection="row" display="flex">
        <Typography variant="h1">{t('articles.overview.articles')}</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label={t('articles.overview.newArticle')}
          route={ArticleCreateRoute.create({})}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder={t('articles.overview.search')}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {articles?.length ? (
          <>
            {articles}
            <Box display="flex" justifyContent="center">
              {data?.articles.pageInfo.hasNextPage && (
                <Button label={t('articles.overview.loadMore')} onClick={loadMore} />
              )}
            </Box>
          </>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            {t('articles.overview.noArticlesFound')}
          </Typography>
        ) : null}
      </Box>

      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title={
                confirmAction === ConfirmAction.Unpublish
                  ? t('articles.panels.unpublishArticle')
                  : t('articles.panels.deleteArticle')
              }
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label={t('articles.panels.cancel')}
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label={t('articles.panels.confirm')}
                  disabled={isUnpublishing || isDeleting}
                  onClick={async () => {
                    if (!currentArticle) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deleteArticle({
                          variables: {id: currentArticle.id},
                          update: cache => {
                            const query = cache.readQuery<ArticleListQuery>({
                              query: ArticleListDocument,
                              variables: listVariables
                            })

                            if (!query) return

                            cache.writeQuery<ArticleListQuery>({
                              query: ArticleListDocument,
                              data: {
                                articles: {
                                  ...query.articles,
                                  nodes: query.articles.nodes.filter(
                                    article => article.id !== currentArticle.id
                                  )
                                }
                              },
                              variables: listVariables
                            })
                          }
                        })
                        break

                      case ConfirmAction.Unpublish:
                        await unpublishArticle({
                          variables: {id: currentArticle.id}
                        })
                        break
                    }

                    setConfirmationDialogOpen(false)
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label={t('articles.panels.title')}>
                  {currentArticle?.latest.title || t('articles.panels.untitled')}
                </DescriptionListItem>

                {currentArticle?.latest.lead && (
                  <DescriptionListItem label={t('articles.panels.lead')}>
                    {currentArticle?.latest.lead}
                  </DescriptionListItem>
                )}

                <DescriptionListItem label={t('articles.panels.createdAt')}>
                  {currentArticle?.createdAt && new Date(currentArticle.createdAt).toLocaleString()}
                </DescriptionListItem>

                <DescriptionListItem label={t('articles.panels.updatedAt')}>
                  {currentArticle?.latest.updatedAt &&
                    new Date(currentArticle.latest.updatedAt).toLocaleString()}
                </DescriptionListItem>

                {currentArticle?.latest.publishedAt && (
                  <DescriptionListItem label={t('articles.panels.publishedAt')}>
                    {new Date(currentArticle.createdAt).toLocaleString()}
                  </DescriptionListItem>
                )}
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
