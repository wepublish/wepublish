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
  UserEditRoute,
  UserCreateRoute,
  UserListRoute
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {
  MaterialIconDeleteOutlined,
  MaterialIconClose,
  MaterialIconCheck,
  MaterialIconRestoreOutlined
} from '@karma.run/icons'
import {useDeleteUserMutation, FullUserFragment, useUserListQuery} from '../api'
import {UserEditPanel} from '../panel/userEditPanel'
import {ResetUserPasswordPanel} from '../panel/resetUserPasswordPanel'

import {useTranslation} from 'react-i18next'

enum ConfirmAction {
  Delete = 'delete'
}

export function UserList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.UserEdit || current?.type === RouteType.UserCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.UserEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState(false)
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<FullUserFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const {data, refetch, loading: isLoading} = useUserListQuery({
    variables: {
      filter: filter || undefined,
      first: 50 // TODO: Pagination
    },
    fetchPolicy: 'network-only'
  })

  const [deleteUser, {loading: isDeleting}] = useDeleteUserMutation()

  const {t} = useTranslation()

  useEffect(() => {
    if (current?.type === RouteType.UserCreate) {
      setEditID(undefined)
      setEditModalOpen(true)
    }

    if (current?.type === RouteType.UserEdit) {
      setEditID(current.params.id)
      setEditModalOpen(true)
    }
  }, [current])

  /* function loadMore() {
    fetchMore({
      variables: {first: 50, after: data?.users.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          users: {
            ...fetchMoreResult.users,
            nodes: [...prev.users.nodes, ...fetchMoreResult?.users.nodes]
          }
        }
      }
    })
  } */

  const users = data?.users.nodes.map(user => {
    const {id, name, email} = user

    return (
      <Box key={id} display="block" marginBottom={Spacing.ExtraSmall}>
        <Box
          key={id}
          marginBottom={Spacing.ExtraSmall}
          display="flex"
          flexDirection="row"
          alignItems="center">
          <Link route={UserEditRoute.create({id})}>
            <Typography variant="h3" color={name ? 'dark' : 'gray'}>
              {name || t('userList.overview.unknown')}
            </Typography>
            <Typography variant="body1" color={email ? 'dark' : 'gray'}>
              {email || t('userList.overview.noDescription')}
            </Typography>
          </Link>

          <Box flexGrow={1} />
          <OptionButton
            position="left"
            menuItems={[
              {
                id: 'resetUserPassword',
                label: t('userList.overview.resetPassword'),
                icon: MaterialIconRestoreOutlined
              },
              {
                id: ConfirmAction.Delete,
                label: t('userList.overview.delete'),
                icon: MaterialIconDeleteOutlined
              }
            ]}
            onMenuItemClick={item => {
              setCurrentUser(user)
              switch (item.id) {
                case ConfirmAction.Delete:
                  setConfirmationDialogOpen(true)
                  setConfirmAction(item.id as ConfirmAction)
                  break
                case 'resetUserPassword':
                  setIsResetUserPasswordOpen(true)
                  break
              }
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
        <Typography variant="h1">{t('userList.overview.users')}</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label={t('userList.overview.newUser')}
          route={UserCreateRoute.create({})}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder={t('userList.overview.search')}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {users?.length ? (
          users
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            {t('userList.overview.noUsersFound')}
          </Typography>
        ) : null}
      </Box>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <UserEditPanel
            id={editID!}
            onClose={() => {
              setEditModalOpen(false)
              dispatch({
                type: RouteActionType.PushRoute,
                route: UserListRoute.create({}, current ?? undefined)
              })
            }}
            onSave={() => {
              setEditModalOpen(false)
              refetch()
              dispatch({
                type: RouteActionType.PushRoute,
                route: UserListRoute.create({}, current ?? undefined)
              })
            }}
          />
        )}
      </Drawer>
      <Dialog
        open={isResetUserPasswordOpen}
        onClose={() => setIsResetUserPasswordOpen(false)}
        width={480}
        closeOnBackgroundClick>
        {() => (
          <ResetUserPasswordPanel
            userID={currentUser?.id}
            userName={currentUser?.name}
            onClose={() => setIsResetUserPasswordOpen(false)}
          />
        )}
      </Dialog>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title={t('userList.panels.deleteUser')}
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label={t('userList.panels.cancel')}
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label={t('userList.panels.confirm')}
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!currentUser) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deleteUser({
                          variables: {id: currentUser.id}
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
                <DescriptionListItem label={t('userList.panels.name')}>
                  {currentUser?.name || t('userList.panels.Unknown')}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
