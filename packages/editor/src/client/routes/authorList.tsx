import React, {useState, useEffect} from 'react'
import {
  Typography,
  Box,
  Spacing,
  Divider,
  Avatar,
  PlaceholderImage,
  Drawer,
  Image,
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

import {
  RouteLinkButton,
  Link,
  AuthorEditRoute,
  RouteType,
  useRoute,
  useRouteDispatch,
  AuthorListRoute,
  AuthorCreateRoute
} from '../route'

import {useAuthorListQuery, useDeleteAuthorMutation, FullAuthorFragment} from '../api'
import {AuthorEditPanel} from '../panel/authorEditPanel'
import {RouteActionType} from '@karma.run/react'
import {MaterialIconDeleteOutlined, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

enum ConfirmAction {
  Delete = 'delete'
}

export function AuthorList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.AuthorEdit || current?.type === RouteType.AuthorCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.AuthorEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentAuthor, setCurrentAuthor] = useState<FullAuthorFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const {data, fetchMore, loading: isLoading} = useAuthorListQuery({
    variables: {
      filter: filter || undefined,
      first: 50
    },
    fetchPolicy: 'network-only'
  })

  const [deleteAuthor, {loading: isDeleting}] = useDeleteAuthorMutation()

  useEffect(() => {
    switch (current?.type) {
      case RouteType.AuthorCreate:
        setEditID(undefined)
        setEditModalOpen(true)
        break

      case RouteType.AuthorEdit:
        setEditID(current.params.id)
        setEditModalOpen(true)
        break
    }
  }, [current])

  function loadMore() {
    fetchMore({
      variables: {first: 50, after: data?.authors.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          authors: {
            ...fetchMoreResult.authors,
            nodes: [...prev.authors.nodes, ...fetchMoreResult?.authors.nodes]
          }
        }
      }
    })
  }

  const authors = data?.authors.nodes.map(author => {
    const {id, name, image} = author

    return (
      <Box key={id} display="block" marginBottom={Spacing.ExtraSmall}>
        <Box
          key={id}
          marginBottom={Spacing.ExtraSmall}
          display="flex"
          flexDirection="row"
          alignItems="center">
          <Avatar width={50} height={50} marginRight={Spacing.Small}>
            {image ? (
              image.squareURL && <Image src={image.squareURL} width="100%" height="100%" />
            ) : (
              <PlaceholderImage width="100%" height="100%" />
            )}
          </Avatar>

          <Link route={AuthorEditRoute.create({id})}>
            <Typography variant="h3" color={name ? 'dark' : 'gray'}>
              {name || 'Unknown'}
            </Typography>
          </Link>

          <Box flexGrow={1} />
          <OptionButton
            position="left"
            menuItems={[
              {id: ConfirmAction.Delete, label: 'Delete', icon: MaterialIconDeleteOutlined}
            ]}
            onMenuItemClick={item => {
              setCurrentAuthor(author)
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
        <Typography variant="h1">Authors</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton color="primary" label="New Author" route={AuthorCreateRoute.create({})} />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder="Search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {authors?.length ? (
          <>
            {authors}
            <Box display="flex" justifyContent="center">
              {data?.authors.pageInfo.hasNextPage && (
                <Button label="Load More" onClick={loadMore} />
              )}
            </Box>
          </>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No Authors found
          </Typography>
        ) : null}
      </Box>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <AuthorEditPanel
            id={editID}
            onClose={() => {
              setEditModalOpen(false)
              dispatch({
                type: RouteActionType.PushRoute,
                route: AuthorListRoute.create({}, current ?? undefined)
              })
            }}
            onSave={() => {
              setEditModalOpen(false)
              dispatch({
                type: RouteActionType.PushRoute,
                route: AuthorListRoute.create({}, current ?? undefined)
              })
            }}
          />
        )}
      </Drawer>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title="Delete Author?"
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
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!currentAuthor) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deleteAuthor({
                          variables: {id: currentAuthor.id}
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
                <DescriptionListItem label="Name">
                  {currentAuthor?.name || 'Unknown'}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
