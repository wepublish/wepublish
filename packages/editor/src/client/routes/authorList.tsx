import React, {useState, useEffect} from 'react'
import {
  Typography,
  Box,
  Spacing,
  Divider,
  Avatar,
  ImagePlaceholder,
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
  DescriptionListItem
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

import {useListAuthorsQuery, Author, useDeleteAuthorMutation} from '../api/author'
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

  const [editID, setEditID] = useState<string | null>(
    current?.type === RouteType.AuthorEdit ? current.params.id : null
  )

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentAuthor, setCurrentAuthor] = useState<Author>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const {data, refetch, loading: isLoading} = useListAuthorsQuery({
    variables: {
      filter: filter || undefined,
      first: 200 // TODO: Pagination
    },
    fetchPolicy: 'network-only'
  })

  const [deleteAuthor, {loading: isDeleting}] = useDeleteAuthorMutation()

  useEffect(() => {
    if (current?.type === RouteType.AuthorCreate) {
      setEditID(null)
      setEditModalOpen(true)
    }

    if (current?.type === RouteType.AuthorEdit) {
      setEditID(current.params.id)
      setEditModalOpen(true)
    }
  }, [current])

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
              <Image src={image.squareURL} width="100%" height="100%" />
            ) : (
              <ImagePlaceholder width="100%" height="100%" />
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
          authors
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No Authors found
          </Typography>
        ) : null}
      </Box>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <AuthorEditPanel
            id={editID!}
            onClose={() => {
              setEditModalOpen(false)
              dispatch({
                type: RouteActionType.PushRoute,
                route: AuthorListRoute.create({}, current ?? undefined)
              })
            }}
            onSave={() => {
              setEditModalOpen(false)
              refetch()
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
                    refetch()
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
