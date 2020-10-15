import React, {useState} from 'react'

import {
  MaterialIconQueryBuilder,
  MaterialIconUpdate,
  MaterialIconClose,
  MaterialIconCheck,
  MaterialIconGetAppOutlined,
  MaterialIconDeleteOutlined
} from '@karma.run/icons'
import {
  Typography,
  Box,
  Spacing,
  Divider,
  Icon,
  IconScale,
  SearchInput,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  OptionButton,
  Button
} from '@karma.run/ui'

import {RouteLinkButton, Link, PageCreateRoute, PageEditRoute} from '../route'

import {
  PageRefFragment,
  usePageListQuery,
  useDeletePageMutation,
  useUnpublishPageMutation,
  PageListDocument,
  PageListQuery
} from '../api'

import {useTranslation} from 'react-i18next'

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
}

const PagesPerPage = 50

export function PageList() {
  const {t} = useTranslation()

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageRefFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [deletePage, {loading: isDeleting}] = useDeletePageMutation()
  const [unpublishPage, {loading: isUnpublishing}] = useUnpublishPageMutation()

  const listVariables = {filter: filter || undefined, first: PagesPerPage}
  const {data, fetchMore, loading: isLoading} = usePageListQuery({
    variables: {filter: filter || undefined, first: 50},
    fetchPolicy: 'no-cache'
  })

  function loadMore() {
    fetchMore({
      variables: {first: 50, after: data?.pages.pageInfo.endCursor},
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

  const pages = data?.pages.nodes.map(page => {
    const {
      id,
      createdAt,
      modifiedAt,
      draft,
      pending,
      published,
      latest: {title}
    } = page

    const states = []

    if (draft) states.push(t('pages.overview.draft'))
    if (pending) states.push(t('pages.overview.pending'))
    if (published) states.push(t('pages.overview.published'))

    return (
      <Box key={id} marginBottom={Spacing.Small}>
        <Box marginBottom={Spacing.ExtraSmall}>
          <Link route={PageEditRoute.create({id})}>
            <Typography variant="h3" color={title ? 'dark' : 'gray'}>
              {title || t('pages.overview.untitled')}
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
                      label: t('pages.panels.unpublish'),
                      icon: MaterialIconGetAppOutlined
                    },
                    {
                      id: ConfirmAction.Delete,
                      label: t('pages.panels.delete'),
                      icon: MaterialIconDeleteOutlined
                    }
                  ]
                : [
                    {
                      id: ConfirmAction.Delete,
                      label: t('pages.panels.delete'),
                      icon: MaterialIconDeleteOutlined
                    }
                  ]
            }
            onMenuItemClick={item => {
              setCurrentPage(page)
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
        <Typography variant="h1">{t('pages.overview.pages')}</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label={t('pages.overview.newPage')}
          route={PageCreateRoute.create({})}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder={t('pages.overview.search')}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {pages?.length ? (
          <>
            {pages}
            <Box display="flex" justifyContent="center">
              {data?.pages.pageInfo.hasNextPage && (
                <Button label={t('pages.overview.loadMore')} onClick={loadMore} />
              )}
            </Box>
          </>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            {t('pages.overview.noPages')}
          </Typography>
        ) : null}
      </Box>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title={
                confirmAction === ConfirmAction.Unpublish
                  ? t('pages.panels.unpublishPage')
                  : t('pages.panels.deletePage')
              }
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label={t('pages.panels.cancel')}
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label={t('pages.panels.confirm')}
                  disabled={isUnpublishing || isDeleting}
                  onClick={async () => {
                    if (!currentPage) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deletePage({
                          variables: {id: currentPage.id},
                          update: cache => {
                            const query = cache.readQuery<PageListQuery>({
                              query: PageListDocument,
                              variables: listVariables
                            })

                            if (!query) return

                            cache.writeQuery<PageListQuery>({
                              query: PageListDocument,
                              data: {
                                pages: {
                                  ...query.pages,
                                  nodes: query.pages.nodes.filter(
                                    page => page.id !== currentPage.id
                                  )
                                }
                              },
                              variables: listVariables
                            })
                          }
                        })
                        break

                      case ConfirmAction.Unpublish:
                        await unpublishPage({
                          variables: {id: currentPage.id}
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
                <DescriptionListItem label={t('pages.panels.title')}>
                  {currentPage?.latest.title || t('pages.panels.untitled')}
                </DescriptionListItem>

                {currentPage?.latest.description && (
                  <DescriptionListItem label={t('pages.panels.lead')}>
                    {currentPage?.latest.description}
                  </DescriptionListItem>
                )}

                <DescriptionListItem label={t('pages.panels.createdAt')}>
                  {currentPage?.createdAt && new Date(currentPage.createdAt).toLocaleString()}
                </DescriptionListItem>

                <DescriptionListItem label={t('pages.panels.updatedAt')}>
                  {currentPage?.latest.updatedAt &&
                    new Date(currentPage.latest.updatedAt).toLocaleString()}
                </DescriptionListItem>

                {currentPage?.latest.publishedAt && (
                  <DescriptionListItem label={t('pages.panels.publishedAt')}>
                    {currentPage?.latest.publishedAt &&
                      new Date(currentPage.createdAt).toLocaleString()}
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
