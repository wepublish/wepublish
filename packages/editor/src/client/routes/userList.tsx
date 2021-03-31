import React, {useEffect, useState} from 'react'

import {
  ButtonLink,
  Link,
  RouteType,
  UserCreateRoute,
  UserEditRoute,
  UserListRoute,
  useRoute,
  useRouteDispatch
} from '../route'

import {RouteActionType} from '@karma.run/react'

import {FullUserFragment, useDeleteUserMutation, UserSort, useUserListQuery} from '../api'
import {UserEditPanel} from '../panel/userEditPanel'
import {ResetUserPasswordPanel} from '../panel/resetUserPasswordPanel'

import {useTranslation} from 'react-i18next'
import {
  Button,
  FlexboxGrid,
  Icon,
  Input,
  InputGroup,
  Modal,
  Table,
  Popover,
  Whisper,
  Divider
} from 'rsuite'
import {DEFAULT_TABLE_PAGE_SIZES, mapTableSortTypeToGraphQLSortOrder} from '../utility'

const {Column, HeaderCell, Cell, Pagination} = Table

function mapColumFieldToGraphQLField(columnField: string): UserSort | null {
  switch (columnField) {
    case 'createdAt':
      return UserSort.CreatedAt
    case 'modifiedAt':
      return UserSort.ModifiedAt
    case 'name':
      return UserSort.Name
    default:
      return null
  }
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
  const [currentUser, setCurrentUser] = useState<FullUserFragment>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [users, setUsers] = useState<FullUserFragment[]>([])

  const {data, refetch, loading: isLoading} = useUserListQuery({
    variables: {
      filter: filter || undefined,
      first: limit,
      skip: page - 1,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    refetch({
      filter: filter || undefined,
      first: limit,
      skip: page - 1,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    })
  }, [filter, page, limit, sortOrder, sortField])

  const [deleteUser, {loading: isDeleting}] = useDeleteUserMutation()

  const {t} = useTranslation()

  const speaker = (
    <Popover title={t('userList.popover.deleteThisUser')}>
      <Button
        color="red"
        disabled={isDeleting}
        onClick={async () => {
          if (!currentUser) return

          await deleteUser({
            variables: {id: currentUser.id}
          })
          refetch()
        }}>
        {t('global.buttons.deleteNow')}
      </Button>
    </Popover>
  )

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
      if (data.users.totalCount + 9 < page * limit) {
        setPage(1)
      }
    }
  }, [data?.users])

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
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
            <Input value={filter} onChange={value => setFilter(value)} />
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table
        style={{marginTop: '20px'}}
        autoHeight={true}
        loading={isLoading}
        data={users}
        sortColumn={sortField}
        sortType={sortOrder}
        onSortColumn={(sortColumn, sortType) => {
          setSortOrder(sortType)
          setSortField(sortColumn)
        }}>
        <Column flexGrow={2} align="left" sortable>
          <HeaderCell>{t('userList.overview.name')}</HeaderCell>
          <Cell dataKey={'name'}>
            {(rowData: FullUserFragment) => (
              <Link route={UserEditRoute.create({id: rowData.id})}>
                {rowData.name || t('userList.overview.unknown')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column flexGrow={2} align="left" sortable>
          <HeaderCell>{t('email')}</HeaderCell>
          <Cell dataKey="email" />
        </Column>
        <Column flexGrow={1} align="left" sortable>
          <HeaderCell>{t('userList.overview.createdAt')}</HeaderCell>
          <Cell dataKey="createdAt">
            {({createdAt}: FullUserFragment) => new Date(createdAt).toDateString()}
          </Cell>
        </Column>
        <Column flexGrow={1} align="left" sortable>
          <HeaderCell>{t('userList.overview.modifiedAt')}</HeaderCell>
          <Cell dataKey="modifiedAt">
            {({modifiedAt}: FullUserFragment) => new Date(modifiedAt).toDateString()}
          </Cell>
        </Column>

        <Column width={250} align="right" fixed="right">
          <HeaderCell>{t('action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullUserFragment) => (
              <>
                <Button
                  color="orange"
                  appearance="link"
                  onClick={e => {
                    setCurrentUser(rowData)
                    setIsResetUserPasswordOpen(true)
                  }}>
                  {t('userList.overview.reset')}
                </Button>
                <Divider vertical></Divider>
                <Whisper placement="left" trigger="click" speaker={speaker}>
                  <Button
                    appearance="link"
                    color="red"
                    onClick={() => {
                      setCurrentUser(rowData)
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

      <Pagination
        lengthMenu={DEFAULT_TABLE_PAGE_SIZES}
        activePage={page}
        displayLength={limit}
        total={data?.users.totalCount}
        onChangePage={page => setPage(page)}
        onChangeLength={limit => setLimit(limit)}
      />

      {/* Modal: Create/edit user */}
      <Modal
        size={'sm'}
        show={isEditModalOpen}
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
      </Modal>

      {/* Modal: Reset password */}
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
    </>
  )
}
