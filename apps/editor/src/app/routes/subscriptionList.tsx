import styled from '@emotion/styled'
import React, {useEffect, useState} from 'react'
import {TFunction, useTranslation} from 'react-i18next'
import {MdAdd, MdDelete} from 'react-icons/md'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {
  Button,
  Drawer,
  FlexboxGrid,
  IconButton as RIconButton,
  Modal,
  Pagination,
  Table as RTable
} from 'rsuite'
import {RowDataType} from 'rsuite-table'

import {
  FullSubscriptionFragment,
  SubscriptionFilter,
  SubscriptionSort,
  useDeleteSubscriptionMutation,
  useSubscriptionListQuery
} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation
} from '../atoms/permissionControl'
import {SubscriptionListFilter} from '../atoms/searchAndFilter/subscriptionListFilter'
import {ExportSubscriptionsAsCsv} from '../panel/ExportSubscriptionsAsCsv'
import {SubscriptionEditPanel} from '../panel/subscriptionEditPanel'
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder
} from '../utility'

const {Column, HeaderCell, Cell: RCell} = RTable

const Cell = styled(RCell)`
  .rs-table-cell-content {
    padding: 6px 0;
  }
`

const IconButtonSmallMargin = styled(RIconButton)`
  margin-left: 5px;
`

const Table = styled(RTable)`
  flex: 1;
  cursor: pointer;
`

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  margin-top: 20px;
`

const IconButton = styled(RIconButton)`
  margin-left: 20px;
`

const FlexItem = styled(FlexboxGrid.Item)`
  text-align: right;
`

function mapColumFieldToGraphQLField(columnField: string): SubscriptionSort | null {
  switch (columnField) {
    case 'createdAt':
      return SubscriptionSort.CreatedAt
    case 'modifiedAt':
      return SubscriptionSort.ModifiedAt
    default:
      return null
  }
}

export const NewSubscriptionButton = ({
  isLoading,
  t
}: {
  isLoading?: boolean
  t: TFunction<'translation'>
}) => {
  const canCreate = useAuthorisation('CAN_CREATE_SUBSCRIPTION')
  return (
    <Link to="/subscriptions/create">
      <IconButton appearance="primary" disabled={isLoading || !canCreate}>
        <MdAdd />
        {t('subscriptionList.overview.newSubscription')}
      </IconButton>
    </Link>
  )
}

function SubscriptionList() {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const {id} = params

  const isCreateRoute = location.pathname.includes('create')
  const isEditRoute = location.pathname.includes('edit')

  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute || isCreateRoute)
  const [editID, setEditID] = useState<string | undefined>(isEditRoute ? id : undefined)

  const [filter, setFilter] = useState({} as SubscriptionFilter)
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<FullSubscriptionFragment>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [subscriptions, setSubscriptions] = useState<FullSubscriptionFragment[]>([])

  // double check
  Object.keys(filter).map(el => {
    if (filter[el as keyof SubscriptionFilter] === null)
      delete filter[el as keyof SubscriptionFilter]
  })

  const {data, refetch, loading: isLoading} = useSubscriptionListQuery({
    variables: {
      filter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    refetch({
      filter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    })
  }, [filter, page, limit, sortOrder, sortField])

  const [deleteSubscription, {loading: isDeleting}] = useDeleteSubscriptionMutation()

  const {t} = useTranslation()

  useEffect(() => {
    if (isCreateRoute) {
      setEditID(undefined)
      setEditModalOpen(true)
    }

    if (isEditRoute) {
      setEditID(id)
      setEditModalOpen(true)
    }
  }, [location])

  useEffect(() => {
    if (data?.subscriptions?.nodes) {
      setSubscriptions(data.subscriptions.nodes)
      if (data.subscriptions.totalCount + 9 < page * limit) {
        setPage(1)
      }
    }
  }, [data?.subscriptions])

  /**
   * UI helper
   */
  function userNameView(fullUser: FullSubscriptionFragment): React.ReactElement {
    const user = fullUser.user
    // user deleted
    if (!user) {
      return t('subscriptionList.overview.deleted')
    }

    return (
      <>
        <span>{user.firstName} </span>
        <span>{user.name}</span>
      </>
    )
  }

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={12}>
          <h2>{t('subscriptionList.overview.subscription')}</h2>
        </FlexboxGrid.Item>
        <FlexItem colspan={12}>
          <ExportSubscriptionsAsCsv filter={filter} />
          <PermissionControl qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION']}>
            {NewSubscriptionButton({isLoading, t})}
          </PermissionControl>
        </FlexItem>
      </FlexboxGrid>

      {/* Filter */}
      <FlexboxGrid>
        <SubscriptionListFilter
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => setFilter(filter)}
        />
      </FlexboxGrid>

      <Wrapper>
        <Table
          minHeight={600}
          autoHeight
          loading={isLoading}
          data={subscriptions}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}
          onRowClick={data => {
            navigate(`/subscriptions/edit/${data.id}`)
          }}>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('subscriptionList.overview.createdAt')}</HeaderCell>
            <RCell dataKey="createdAt">
              {({createdAt}: RowDataType<FullSubscriptionFragment>) =>
                t('subscriptionList.overview.createdAtDate', {createdAtDate: new Date(createdAt)})
              }
            </RCell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.modifiedAt')}</HeaderCell>
            <RCell dataKey="modifiedAt">
              {({modifiedAt}: RowDataType<FullSubscriptionFragment>) =>
                t('subscriptionList.overview.modifiedAtDate', {
                  modifiedAtDate: new Date(modifiedAt)
                })
              }
            </RCell>
          </Column>
          {/* subscription */}
          <Column width={200}>
            <HeaderCell>{t('subscriptionList.overview.memberPlan')}</HeaderCell>
            <RCell dataKey={'subscription'}>
              {(rowData: RowDataType<FullSubscriptionFragment>) => (
                <Link to={`/subscription/edit/${rowData.id}`}>{rowData.memberPlan.name}</Link>
              )}
            </RCell>
          </Column>
          {/* name */}
          <Column width={300} align="left" resizable sortable>
            <HeaderCell>{t('subscriptionList.overview.name')}</HeaderCell>
            <RCell dataKey={'name'}>
              {(rowData: RowDataType<FullSubscriptionFragment>) =>
                userNameView(rowData as FullSubscriptionFragment)
              }
            </RCell>
          </Column>
          {/* email */}
          <Column width={250}>
            <HeaderCell>{t('subscriptionList.overview.email')}</HeaderCell>
            <RCell dataKey={'email'}>
              {(rowData: RowDataType<FullSubscriptionFragment>) => (
                <div>{rowData.user?.email || t('subscriptionList.overview.deleted')}</div>
              )}
            </RCell>
          </Column>
          {/* action */}
          <Column width={100} align="center" fixed="right">
            <HeaderCell>{t('action')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<FullSubscriptionFragment>) => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButtonSmallMargin
                    circle
                    size="sm"
                    appearance="ghost"
                    color="red"
                    icon={<MdDelete />}
                    onClick={() => {
                      setCurrentSubscription(rowData as FullSubscriptionFragment)
                      setConfirmationDialogOpen(true)
                    }}
                  />
                </IconButtonTooltip>
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.subscriptions.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </Wrapper>

      <Drawer
        open={isEditModalOpen}
        size="sm"
        onClose={() => {
          setEditModalOpen(false)
          navigate('/subscriptions')
        }}>
        <SubscriptionEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false)
            navigate('/subscriptions')
          }}
          onSave={() => {
            setEditModalOpen(false)
            refetch()
            navigate('/subscriptions')
          }}
        />
      </Drawer>

      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('subscriptionList.panels.deleteSubscription')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('subscriptionList.panels.name')}>
              {currentSubscription?.user?.name || t('subscriptionList.panels.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentSubscription) return

              await deleteSubscription({
                variables: {id: currentSubscription.id}
              })

              setConfirmationDialogOpen(false)
              refetch()
            }}
            color="red">
            {t('subscriptionList.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('subscriptionList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTIONS',
  'CAN_GET_SUBSCRIPTION',
  'CAN_CREATE_SUBSCRIPTION',
  'CAN_DELETE_SUBSCRIPTION'
])(SubscriptionList)
export {CheckedPermissionComponent as SubscriptionList}
