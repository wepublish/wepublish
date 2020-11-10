import React, {useState, useEffect} from 'react'
import {
  RouteType,
  useRoute,
  useRouteDispatch,
  UserRoleCreateRoute,
  UserRoleListRoute,
  ButtonLink,
  UserRoleEditRoute
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {useDeleteUserRoleMutation, useUserRoleListQuery, FullUserRoleFragment} from '../api'
import {UserRoleEditPanel} from '../panel/userRoleEditPanel'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  Icon,
  IconButton,
  Input,
  InputGroup,
  Table,
  Drawer,
  Modal,
  Button
} from 'rsuite'
const {Column, HeaderCell, Cell /*, Pagination */} = Table

export function UserRoleList() {
  const {t} = useTranslation()

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
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<FullUserRoleFragment>()

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

  useEffect(() => {
    if (data?.userRoles?.nodes) {
      setUserRoles(data.userRoles.nodes)
    }
  }, [data?.userRoles])

  const DeleteCell = ({rowData, dataKey, ...props}: any) => {
    return (
      <Cell {...props} style={{padding: '6px 0'}}>
        <IconButton
          icon={<Icon icon="wrench" />}
          circle
          size="sm"
          onClick={() => {
            dispatch({
              type: RouteActionType.PushRoute,
              route: UserRoleEditRoute.create({id: rowData.id})
            })
          }}
        />
        <IconButton
          icon={<Icon icon="trash" />}
          disabled={rowData.systemRole}
          circle
          size="sm"
          style={{marginLeft: '5px'}}
          onClick={() => {
            setConfirmationDialogOpen(true)
            setCurrentUserRole(rowData)
          }}
        />
      </Cell>
    )
  }

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('userRoles.overview.userRoles')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isLoading}
            route={UserRoleCreateRoute.create({})}>
            {t('userRoles.overview.newUserRole')}
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

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={userRoles}>
        <Column width={100} align="left" resizable>
          <HeaderCell>Id</HeaderCell>
          <Cell dataKey="id" />
        </Column>
        <Column width={100} align="left" resizable>
          <HeaderCell>Name</HeaderCell>
          <Cell dataKey="name" />
        </Column>
        <Column width={400} align="left" resizable>
          <HeaderCell>Description</HeaderCell>
          <Cell dataKey="description" />
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>Action</HeaderCell>
          <DeleteCell dataKey="id" />
        </Column>
      </Table>

      <Drawer
        show={isEditModalOpen}
        onHide={() => {
          setEditModalOpen(false)
          dispatch({
            type: RouteActionType.PushRoute,
            route: UserRoleListRoute.create({}, current ?? undefined)
          })
        }}
        size={'sm'}>
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
      </Drawer>
      <Modal show={isConfirmationDialogOpen} onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('userRoles.panels.deleteUserRole')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {t('userRoles.panels.deleteTokenText', {
            name: currentUserRole?.name || currentUserRole?.id
          })}
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentUserRole) return

              await deleteUserRole({
                variables: {id: currentUserRole.id}
              })

              setConfirmationDialogOpen(false)
              refetch()
            }}
            color="red">
            {t('userRoles.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('userRoles.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
