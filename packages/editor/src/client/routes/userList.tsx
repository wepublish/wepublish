import React, {useState, useEffect} from 'react'

import {
  RouteType,
  useRoute,
  useRouteDispatch,
  UserEditRoute,
  UserCreateRoute,
  UserListRoute,
  ButtonLink,
  Link
} from '../route'

import {RouteActionType} from '@karma.run/react'

import {useDeleteUserMutation, FullUserFragment, useUserListQuery} from '../api'
import {UserEditPanel} from '../panel/userEditPanel'
import {ResetUserPasswordPanel} from '../panel/resetUserPasswordPanel'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  Icon,
  Input,
  Drawer,
  InputGroup,
  Table,
  IconButton,
  Modal,
  Button
} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
const {Column, HeaderCell, Cell /*, Pagination */} = Table

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

  const [users, setUsers] = useState<FullUserFragment[]>([])

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

  useEffect(() => {
    if (data?.users?.nodes) {
      setUsers(data.users.nodes)
    }
  }, [data?.users])

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

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('userList.overview.users')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink appearance="primary" disabled={isLoading} route={UserCreateRoute.create({})}>
            {t('userList.overview.newUser')}
          </ButtonLink>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={users}>
        <Column width={200} align="left" resizable>
          <HeaderCell>Name</HeaderCell>
          <Cell>
            {(rowData: FullUserFragment) => (
              <Link route={UserEditRoute.create({id: rowData.id})}>
                {rowData.name || t('userList.overview.untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={400} align="left" resizable>
          <HeaderCell>Description</HeaderCell>
          <Cell dataKey="email" />
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>Action</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullUserFragment) => (
              <>
                <IconButton
                  icon={<Icon icon="key" />}
                  circle
                  size="sm"
                  style={{marginLeft: '5px'}}
                  onClick={e => {
                    setCurrentUser(rowData)
                    setIsResetUserPasswordOpen(true)
                  }}
                />
                <IconButton
                  icon={<Icon icon="trash" />}
                  circle
                  size="sm"
                  style={{marginLeft: '5px'}}
                  onClick={() => {
                    setConfirmationDialogOpen(true)
                    setCurrentUser(rowData)
                  }}
                />
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Drawer
        show={isEditModalOpen}
        size={'sm'}
        onHide={() => {
          setEditModalOpen(false)
          dispatch({
            type: RouteActionType.PushRoute,
            route: UserListRoute.create({}, current ?? undefined)
          })
        }}>
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
      </Drawer>

      <Modal show={isResetUserPasswordOpen} onHide={() => setIsResetUserPasswordOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('userList.panels.resetPassword')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <ResetUserPasswordPanel
            userID={currentUser?.id}
            userName={currentUser?.name}
            onClose={() => setIsResetUserPasswordOpen(false)}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setIsResetUserPasswordOpen(false)} appearance="subtle">
            {t('userList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={isConfirmationDialogOpen} onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('userList.panels.deleteUser')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('userList.panels.name')}>
              {currentUser?.name || t('userList.panels.Unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentUser) return

              await deleteUser({
                variables: {id: currentUser.id}
              })

              setConfirmationDialogOpen(false)
              refetch()
            }}
            color="red">
            {t('userList.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('userList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
