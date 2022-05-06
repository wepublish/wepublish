import React, {useEffect, useState} from 'react'

import {
  ButtonLink,
  Link,
  RouteType,
  SubscriptionCreateRoute,
  SubscriptionEditRoute,
  SubscriptionListRoute,
  UserEditRoute,
  useRoute,
  useRouteDispatch
} from '../route'

import {RouteActionType} from '@wepublish/karma.run-react'

import {
  FullSubscriptionFragment,
  SubscriptionSort,
  useDeleteSubscriptionMutation,
  useSubscriptionListQuery
} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

import {useTranslation} from 'react-i18next'
import {
  Button,
  Drawer,
  FlexboxGrid,
  IconButton,
  Input,
  InputGroup,
  Message,
  Modal,
  Table,
  Pagination
} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {DEFAULT_TABLE_PAGE_SIZES, mapTableSortTypeToGraphQLSortOrder, isTempUser} from '../utility'
import {SubscriptionEditPanel} from '../panel/subscriptionEditPanel'
import {SubscriptionAsCsvModal} from '../panel/ExportSubscriptionsCsvModal'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import SearchIcon from '@rsuite/icons/legacy/Search'

const {Column, HeaderCell, Cell} = Table

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

export function SubscriptionList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.SubscriptionEdit || current?.type === RouteType.SubscriptionCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.SubscriptionEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [isExportModalOpen, setExportModalOpen] = useState<boolean>(false)
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<FullSubscriptionFragment>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [subscriptions, setSubscriptions] = useState<FullSubscriptionFragment[]>([])

  const {data, refetch, loading: isLoading} = useSubscriptionListQuery({
    variables: {
      filter: {},
      first: limit,
      skip: page - 1,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    refetch({
      filter: {},
      first: limit,
      skip: page - 1,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    })
  }, [filter, page, limit, sortOrder, sortField])

  const [deleteSubscription, {loading: isDeleting}] = useDeleteSubscriptionMutation()

  const {t} = useTranslation()

  useEffect(() => {
    if (current?.type === RouteType.SubscriptionCreate) {
      setEditID(undefined)
      setEditModalOpen(true)
    }

    if (current?.type === RouteType.SubscriptionEdit) {
      setEditID(current.params.id)
      setEditModalOpen(true)
    }
  }, [current])

  useEffect(() => {
    if (data?.subscriptions?.nodes) {
      setSubscriptions(data.subscriptions.nodes)
      if (data.subscriptions.totalCount + 9 < page * limit) {
        setPage(1)
      }
    }
  }, [data?.subscriptions])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('subscriptionList.overview.subscription')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <Button appearance="primary" onClick={() => setExportModalOpen(true)}>
            {t('userList.overview.exportSubscriptionsCsv')}
          </Button>
          <ButtonLink
            style={{marginLeft: 5}}
            appearance="primary"
            disabled={isLoading}
            route={SubscriptionCreateRoute.create({})}>
            {t('subscriptionList.overview.newSubscription')}
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
          data={subscriptions}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('subscriptionList.overview.createdAt')}</HeaderCell>
            <Cell dataKey="createdAt">
              {({createdAt}: FullSubscriptionFragment) =>
                t('subscriptionList.overview.createdAtDate', {createdAtDate: new Date(createdAt)})
              }
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('userList.overview.modifiedAt')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({modifiedAt}: FullSubscriptionFragment) =>
                t('subscriptionList.overview.modifiedAtDate', {
                  modifiedAtDate: new Date(modifiedAt)
                })
              }
            </Cell>
          </Column>
          {/* subscription */}
          <Column width={200}>
            <HeaderCell>{t('subscriptionList.overview.memberPlan')}</HeaderCell>
            <Cell dataKey={'subscription'}>
              {(rowData: FullSubscriptionFragment) => (
                <Link route={SubscriptionEditRoute.create({id: rowData.id})}>
                  {rowData.memberPlan.name}
                </Link>
              )}
            </Cell>
          </Column>
          {/* name */}
          <Column width={300} align="left" resizable sortable>
            <HeaderCell>{t('subscriptionList.overview.name')}</HeaderCell>
            <Cell dataKey={'name'}>
              {(rowData: FullSubscriptionFragment) => (
                <Link
                  route={
                    rowData.user
                      ? UserEditRoute.create({id: rowData.user.id})
                      : SubscriptionEditRoute.create({id: rowData.id})
                  }>
                  {isTempUser(rowData.user?.id) && (
                    <span>{t('subscriptionList.overview.tempUser')}</span>
                  )}
                  {rowData.user?.name || t('subscriptionList.overview.deleted')}
                </Link>
              )}
            </Cell>
          </Column>
          {/* email */}
          <Column width={250}>
            <HeaderCell>{t('subscriptionList.overview.email')}</HeaderCell>
            <Cell dataKey={'email'}>
              {(rowData: FullSubscriptionFragment) => (
                <div>{rowData.user?.email || t('subscriptionList.overview.deleted')}</div>
              )}
            </Cell>
          </Column>
          {/* action */}
          <Column width={100} align="center" fixed="right">
            <HeaderCell>{t('action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: FullSubscriptionFragment) => (
                <>
                  <IconButtonTooltip caption={t('subscriptionList.overview.delete')}>
                    <IconButton
                      icon={<TrashIcon />}
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setCurrentSubscription(rowData)
                        setConfirmationDialogOpen(true)
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
          total={data?.subscriptions.totalCount ?? 0}
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
            route: SubscriptionListRoute.create({}, current ?? undefined)
          })
        }}>
        <SubscriptionEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: SubscriptionListRoute.create({}, current ?? undefined)
            })
          }}
          onSave={() => {
            setEditModalOpen(false)
            refetch()
            dispatch({
              type: RouteActionType.PushRoute,
              route: SubscriptionListRoute.create({}, current ?? undefined)
            })
          }}
        />
      </Drawer>

      <Modal open={isExportModalOpen} onClose={() => setExportModalOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('userList.panels.exportSubscriptions')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <SubscriptionAsCsvModal />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setExportModalOpen(false)} appearance="default">
            {t('userList.panels.close')}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('subscriptionList.panels.deleteSubscription')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {currentSubscription && isTempUser(currentSubscription.user?.id) && (
            <Message showIcon type="warning">
              {t('subscriptionList.panels.tempUserWarning')}
            </Message>
          )}
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
