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

import {RouteActionType} from '@wepublish/karma.run-react'

import {FullUserFragment, useDeleteUserMutation, UserSort, useUserListQuery} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {UserEditPanel} from '../panel/userEditPanel'
import {ResetUserPasswordPanel} from '../panel/resetUserPasswordPanel'

import {useTranslation} from 'react-i18next'
import {
  Button,
  Drawer,
  FlexboxGrid,
  IconButton,
  Input,
  InputGroup,
  Modal,
  Table,
  Pagination
} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {DEFAULT_TABLE_PAGE_SIZES, mapTableSortTypeToGraphQLSortOrder} from '../utility'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import SearchIcon from '@rsuite/icons/legacy/Search'
import LockIcon from '@rsuite/icons/legacy/Lock'

const {Column, HeaderCell, Cell} = Table

function mapColumFieldToGraphQLField(columnField: string): UserSort | null {
  switch (columnField) {
    case 'createdAt':
      return UserSort.CreatedAt
    case 'modifiedAt':
      return UserSort.ModifiedAt
    case 'name':
      return UserSort.Name
    case 'firstName':
      return UserSort.FirstName
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
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
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
          <ButtonLink
            style={{marginLeft: 5}}
            appearance="primary"
            disabled={isLoading}
            route={UserCreateRoute.create({})}>
            {t('userList.overview.newUser')}
          </ButtonLink>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <SearchIcon />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <div
        style={{
          display: 'flex',
          flexFlow: 'column',
          marginTop: '20px'
        }}>
        <Table
          minHeight={600}
          autoHeight={true}
          style={{flex: 1}}
          loading={isLoading}
          data={users}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType!)
            setSortField(sortColumn)
          }}>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.createdAt')}</HeaderCell>
            <Cell dataKey="createdAt">
              {({createdAt}: FullUserFragment) =>
                t('userList.overview.createdAtDate', {createdAtDate: new Date(createdAt)})
              }
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.modifiedAt')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({modifiedAt}: FullUserFragment) =>
                t('userList.overview.modifiedAtDate', {modifiedAtDate: new Date(modifiedAt)})
              }
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.firstName')}</HeaderCell>
            <Cell dataKey={'firstName'}>
              {(rowData: FullUserFragment) => (
                <Link route={UserEditRoute.create({id: rowData.id})}>
                  {rowData.firstName || ''}
                </Link>
              )}
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.name')}</HeaderCell>
            <Cell dataKey={'name'}>
              {(rowData: FullUserFragment) => (
                <Link route={UserEditRoute.create({id: rowData.id})}>
                  {rowData.name || t('userList.overview.unknown')}
                </Link>
              )}
            </Cell>
          </Column>
          <Column width={400} align="left" resizable>
            <HeaderCell>{t('email')}</HeaderCell>
            <Cell dataKey="email" />
          </Column>
          <Column width={100} align="center" fixed="right">
            <HeaderCell>{t('action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: FullUserFragment) => (
                <>
                  <IconButtonTooltip caption={t('userList.overview.resetPassword')}>
                    <IconButton
                      icon={<LockIcon />}
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={e => {
                        setCurrentUser(rowData)
                        setIsResetUserPasswordOpen(true)
                      }}
                    />
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('userList.overview.delete')}>
                    <IconButton
                      icon={<TrashIcon />}
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setConfirmationDialogOpen(true)
                        setCurrentUser(rowData)
                      }}
                    />
                  </IconButtonTooltip>
                </>
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.users.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </div>

      <Drawer
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
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

      <Modal open={isResetUserPasswordOpen} onClose={() => setIsResetUserPasswordOpen(false)}>
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

      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
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
