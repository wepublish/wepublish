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
  OptionButton
} from '@karma.run/ui'

import {RouteLinkButton, Link, PageCreateRoute, PageEditRoute} from '../route'

import {
  useListPagesQuery,
  PageReference,
  useDeletePageMutation,
  useUnpublishPageMutation
} from '../api/page'
import {VersionState} from '../api/common'

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
}

export function PageList() {
  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageReference>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [deletePage, {loading: isDeleting}] = useDeletePageMutation()
  const [unpublishPage, {loading: isUnpublishing}] = useUnpublishPageMutation()

  const {data, refetch, loading: isLoading} = useListPagesQuery({
    variables: {filter: filter || undefined},
    fetchPolicy: 'no-cache'
  })

  const pages = data?.pages.nodes
    .sort((a, b) => {
      const dateA = new Date(a.latest.updatedAt)
      const dateB = new Date(b.latest.updatedAt)

      return dateA > dateB ? -1 : 1
    })
    .map(page => {
      const {
        id,
        createdAt,
        publishedAt,
        latest: {updatedAt, title, state}
      } = page

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
              <Box
                marginRight={Spacing.Small}
                flexDirection="row"
                alignItems="center"
                display="flex">
                <Box marginRight={Spacing.Tiny}>
                  <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
                </Box>
                {new Date(updatedAt).toLocaleString()}
              </Box>
            </Typography>
            <Typography element="div" variant="subtitle1" color="gray">
              {publishedAt != undefined && 'Published'}
              {publishedAt != undefined && state === VersionState.Draft && ' / '}
              {state === VersionState.Draft && 'Draft'}
            </Typography>
            <Box flexGrow={1} />
            <OptionButton
              position="left"
              menuItems={
                publishedAt // TODO: Allow disabling menu items
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
          pages
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
                          variables: {id: currentPage.id}
                        })
                        break

                      case ConfirmAction.Unpublish:
                        await unpublishPage({
                          variables: {id: currentPage.id}
                        })
                        break
                    }

                    setConfirmationDialogOpen(false)
                    refetch()
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
                  {currentPage?.createdAt && new Date(currentPage.createdAt).toLocaleString()}
                </DescriptionListItem>

                {currentPage?.publishedAt && (
                  <DescriptionListItem label="Published At">
                    {currentPage?.publishedAt && new Date(currentPage.createdAt).toLocaleString()}
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
