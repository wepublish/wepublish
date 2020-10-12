import React, {useState, useEffect} from 'react'
import {
  Typography,
  Box,
  Spacing,
  Divider,
  Drawer,
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
  RouteType,
  useRoute,
  useRouteDispatch,
  UserRoleEditRoute,
  UserRoleCreateRoute,
  UserRoleListRoute
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {MaterialIconDeleteOutlined, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'
import {useDeleteUserRoleMutation, useUserRoleListQuery, FullUserRoleFragment} from '../api'
import {UserRoleEditPanel} from '../panel/userRoleEditPanel'

enum ConfirmAction {
  Delete = 'delete'
}

export function UserRoleList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.UserRoleEdit || current?.type === RouteType.UserRoleCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.UserRoleEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<FullUserRoleFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const {data, refetch, loading: isLoading} = useUserRoleListQuery({
    variables: {
      filter: filter || undefined,
      first: 200 // TODO: Pagination
    },
    fetchPolicy: 'network-only'
  })

  const [deleteUserRole, {loading: isDeleting}] = useDeleteUserRoleMutation()

  useEffect(() => {
    if (current?.type === RouteType.UserRoleCreate) {
      setEditID(undefined)
      setEditModalOpen(true)
    }

    if (current?.type === RouteType.UserRoleEdit) {
      setEditID(current.params.id)
      setEditModalOpen(true)
    }
  }, [current])

  const userRoles = data?.userRoles.nodes.map(userRole => {
    const {id, name, description, systemRole} = userRole

    return (
      <Box key={id} display="block" marginBottom={Spacing.ExtraSmall}>
        <Box
          key={id}
          marginBottom={Spacing.ExtraSmall}
          display="flex"
          flexDirection="row"
          alignItems="center">
          <Link route={UserRoleEditRoute.create({id})}>
            <Typography variant="h3" color={name ? 'dark' : 'gray'}>
              {name || 'Unknown'}
            </Typography>
            <Typography variant="body1" color={description ? 'dark' : 'gray'}>
              {description || 'No Description'}
            </Typography>
          </Link>

          <Box flexGrow={1} />
          {!systemRole && (
            <OptionButton
              position="left"
              menuItems={[
                {id: ConfirmAction.Delete, label: 'Delete', icon: MaterialIconDeleteOutlined}
              ]}
              onMenuItemClick={item => {
                setCurrentUserRole(userRole)
                setConfirmationDialogOpen(true)
                setConfirmAction(item.id as ConfirmAction)
              }}
            />
          )}
        </Box>
        <Divider />
      </Box>
    )
  })

  return (
    <>
      <Box marginBottom={Spacing.Small} flexDirection="row" display="flex">
        <Typography variant="h1">User Roles</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label="New UserRole"
          route={UserRoleCreateRoute.create({})}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder="Search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {userRoles?.length ? (
          userRoles
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No UserRoles found
          </Typography>
        ) : null}
      </Box>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <UserRoleEditPanel
            id={editID!}
            onClose={() => {
              setEditModalOpen(false)
              dispatch({
                type: RouteActionType.PushRoute,
                route: UserRoleListRoute.create({}, current ?? undefined)
              })
            }}
            onSave={() => {
              setEditModalOpen(false)
              refetch()
              dispatch({
                type: RouteActionType.PushRoute,
                route: UserRoleListRoute.create({}, current ?? undefined)
              })
            }}
          />
        )}
      </Drawer>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title="Delete User Role?"
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
                    if (!currentUserRole) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deleteUserRole({
                          variables: {id: currentUserRole.id}
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
                  {currentUserRole?.name || 'Unknown'}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
