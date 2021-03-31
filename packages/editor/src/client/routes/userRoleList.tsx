import React, {useState, useEffect} from 'react'
import {
  RouteType,
  useRoute,
  useRouteDispatch,
  UserRoleCreateRoute,
  UserRoleListRoute,
  ButtonLink,
  UserRoleEditRoute,
  Link
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {useDeleteUserRoleMutation, useUserRoleListQuery, FullUserRoleFragment} from '../api'
import {UserRoleEditPanel} from '../panel/userRoleEditPanel'

import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Icon, Input, InputGroup, Table, Modal, Button, Popover, Whisper} from 'rsuite'

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

  const speaker = (
    <Popover title={currentUserRole?.name}>
      <Button
        color="red"
        disabled={isDeleting}
        onClick={async () => {
          if (!currentUserRole) return

          await deleteUserRole({
            variables: {id: currentUserRole.id}
          })

          refetch()
        }}>
        {t('global.buttons.deleteNow')}
      </Button>
    </Popover>
  )

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
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
            <Input value={filter} onChange={value => setFilter(value)} />
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={userRoles}>
        <Column flexGrow={1} align="left">
          <HeaderCell>{t('userRoles.overview.name')}</HeaderCell>
          <Cell>
            {(rowData: FullUserRoleFragment) => (
              <Link route={UserRoleEditRoute.create({id: rowData.id})}>
                {rowData.name || t('userRoles.overview.untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column flexGrow={2} align="left">
          <HeaderCell>{t('userRoles.overview.description')}</HeaderCell>
          <Cell dataKey="description" />
        </Column>
        <Column width={60} align="right" fixed="right">
          <HeaderCell>{t('userRoles.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullUserRoleFragment) => (
              <>
                <Whisper placement="left" trigger="click" speaker={speaker}>
                  <Button
                    appearance="link"
                    color="red"
                    onClick={() => {
                      setCurrentUserRole(rowData)
                    }}>
                    {' '}
                    {t('global.buttons.delete')}{' '}
                  </Button>
                </Whisper>
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Modal
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
      </Modal>
    </>
  )
}
