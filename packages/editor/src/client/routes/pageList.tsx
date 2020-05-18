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

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
}

const PagesPerPage = 50

export function PageList() {
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

    if (draft) states.push('Draft')
    if (pending) states.push('Pending')
    if (published) states.push('Published')

    return (
      <Box key={id} marginBottom={Spacing.Small}>
        <Box marginBottom={Spacing.ExtraSmall}>
          <Link route={PageEditRoute.create({id})}>
            <Typography variant="h3" color={title ? 'dark' : 'gray'}>
              {title || 'Untitled'}
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
                      label: 'Unpublish',
                      icon: MaterialIconGetAppOutlined
                    },
                    {id: ConfirmAction.Delete, label: 'Delete', icon: MaterialIconDeleteOutlined}
                  ]
                : [{id: ConfirmAction.Delete, label: 'Delete', icon: MaterialIconDeleteOutlined}]
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
        <Typography variant="h1">Pages</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton color="primary" label="New Page" route={PageCreateRoute.create({})} />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder="Search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {pages?.length ? (
          <>
            {pages}
            <Box display="flex" justifyContent="center">
              {data?.pages.pageInfo.hasNextPage && <Button label="Load More" onClick={loadMore} />}
            </Box>
          </>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No Pages found
          </Typography>
        ) : null}
      </Box>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title={confirmAction === ConfirmAction.Unpublish ? 'Unpublish Page?' : 'Delete Page?'}
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label="Cancel"
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label="Confirm"
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
                <DescriptionListItem label="Title">
                  {currentPage?.latest.title || 'Untitled'}
                </DescriptionListItem>

                {currentPage?.latest.description && (
                  <DescriptionListItem label="Lead">
                    {currentPage?.latest.description}
                  </DescriptionListItem>
                )}

                <DescriptionListItem label="Created At">
                  {currentPage?.createdAt && new Date(currentPage.createdAt).toLocaleString()}
                </DescriptionListItem>

                <DescriptionListItem label="Updated At">
                  {currentPage?.latest.updatedAt &&
                    new Date(currentPage.latest.updatedAt).toLocaleString()}
                </DescriptionListItem>

                {currentPage?.latest.publishedAt && (
                  <DescriptionListItem label="Published At">
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
