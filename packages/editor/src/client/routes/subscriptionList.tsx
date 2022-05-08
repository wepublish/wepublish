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
  DateFilterComparison,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullSubscriptionFragment,
  SubscriptionDeactivationReason,
  // PaymentPeriodicity,
  SubscriptionFilter,
  SubscriptionSort,
  useDeleteSubscriptionMutation,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
  useSubscriptionListQuery
} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

import {useTranslation} from 'react-i18next'
import {
  Button,
  Checkbox,
  ControlLabel,
  DatePicker,
  DateRangePicker,
  Drawer,
  FlexboxGrid,
  FormGroup,
  HelpBlock,
  Icon,
  IconButton,
  Message,
  Modal,
  SelectPicker,
  Table
} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder,
  isTempUser,
  ALL_PAYMENT_PERIODICITIES
} from '../utility'
import {SubscriptionEditPanel} from '../panel/subscriptionEditPanel'
import {SubscriptionAsCsvModal} from '../panel/ExportSubscriptionsCsvModal'

const {Column, HeaderCell, Cell, Pagination} = Table

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

  const [filter, setFilter] = useState({} as SubscriptionFilter)
  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])
  // const [paymentMethod, setPaymentMethod] = useState<FullPaymentMethodFragment>()
  const [memberPlan, setMemberPlan] = useState<FullMemberPlanFragment>()
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])
  const [paidUntil, setPaidUntil] = useState<Date | null>()
  //
  const [isExportModalOpen, setExportModalOpen] = useState<boolean>(false)
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<FullSubscriptionFragment>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [subscriptions, setSubscriptions] = useState<FullSubscriptionFragment[]>([])

  console.log('filter', filter)

  const {data, refetch, loading: isLoading} = useSubscriptionListQuery({
    variables: {
      filter,
      first: limit,
      skip: page - 1,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    },
    fetchPolicy: 'network-only'
  })

  console.log('data', data)

  useEffect(() => {
    refetch({
      filter,
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

  const {
    data: memberPlanData,
    loading: isMemberPlanLoading,
    error: loadMemberPlanError
  } = useMemberPlanListQuery({
    fetchPolicy: 'network-only',
    variables: {
      first: 200 // TODO: Pagination
    }
  })

  const {
    data: paymentMethodData,
    loading: isPaymentMethodLoading,
    error: paymentMethodLoadError
  } = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (memberPlanData?.memberPlans?.nodes) {
      setMemberPlans(memberPlanData.memberPlans.nodes)
    }
  }, [memberPlanData?.memberPlans])

  useEffect(() => {
    if (paymentMethodData?.paymentMethods) {
      setPaymentMethods(paymentMethodData.paymentMethods)
    }
  }, [paymentMethodData?.paymentMethods])

  const isDisabled =
    isLoading ||
    // isCreating ||
    isMemberPlanLoading ||
    // isUpdating ||
    isPaymentMethodLoading ||
    // isUserLoading ||
    // loadError !== undefined ||
    // createError !== undefined ||
    loadMemberPlanError !== undefined ||
    paymentMethodLoadError !== undefined
  // userLoadError !== undefined ||
  // isTempUser

  const updateFilter = (value: SubscriptionFilter) => {
    const newFilter = {
      ...filter,
      ...value
    }
    setFilter(newFilter)
  }

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
        <FormGroup>
          <ControlLabel>{t('userSubscriptionEdit.selectMemberPlan')}</ControlLabel>
          <SelectPicker
            block
            disabled={isDisabled}
            data={memberPlans.map(mp => ({value: mp.id, label: mp.name}))}
            value={memberPlan?.id}
            onChange={value =>
              updateFilter({memberPlanID: memberPlans.find(mp => mp.id === value)?.id})
            }
          />
          {memberPlan && (
            <HelpBlock>
              <DescriptionList>
                <DescriptionListItem label={t('userSubscriptionEdit.memberPlanMonthlyAmount')}>
                  {(memberPlan.amountPerMonthMin / 100).toFixed(2)}
                </DescriptionListItem>
              </DescriptionList>
            </HelpBlock>
          )}
        </FormGroup>
        <FormGroup style={{marginLeft: '15px'}}>
          <ControlLabel>{t('memberPlanList.paymentPeriodicities')}</ControlLabel>
          <SelectPicker
            value={filter.paymentPeriodicity}
            data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
              value: pp,
              label: t(`memberPlanList.paymentPeriodicity.${pp}`)
            }))}
            disabled={isDisabled}
            onChange={value => updateFilter({paymentPeriodicity: value || undefined})}
            block
          />
        </FormGroup>
        <FormGroup style={{marginLeft: '15px'}}>
          <ControlLabel>{t('userSubscriptionEdit.paymentMethod')}</ControlLabel>
          <SelectPicker
            block
            disabled={isDisabled}
            data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
            value={filter.paymentMethodID}
            onChange={value =>
              updateFilter({paymentMethodID: paymentMethods.find(pm => pm.id === value)?.id})
            }
          />
        </FormGroup>
        <FormGroup style={{marginLeft: '15px'}}>
          <ControlLabel>{t('userSubscriptionEdit.autoRenew')}</ControlLabel>
          <Checkbox
            block
            disabled={isDisabled}
            value={filter.autoRenew}
            onChange={(_, checked) => updateFilter({autoRenew: checked})}
          />
        </FormGroup>
        <FormGroup style={{marginLeft: '15px'}}>
          <ControlLabel>Has address</ControlLabel>
          <Checkbox
            block
            disabled={isDisabled}
            value={filter.userHasAddress}
            onChange={(_, checked) => updateFilter({userHasAddress: checked})}
          />
        </FormGroup>

        <FormGroup>
          <ControlLabel>{t('userSubscriptionEdit.deactivation.reason')}</ControlLabel>
          <SelectPicker
            searchable={false}
            data={[
              {
                value: SubscriptionDeactivationReason.None,
                label: t('userSubscriptionEdit.deactivation.reasonNone')
              },
              {
                value: SubscriptionDeactivationReason.UserSelfDeactivated,
                label: t('userSubscriptionEdit.deactivation.reasonUserSelfDeactivated')
              },
              {
                value: SubscriptionDeactivationReason.InvoiceNotPaid,
                label: t('userSubscriptionEdit.deactivation.reasonInvoiceNotPaid')
              }
            ]}
            value={filter.deactivationReason}
            block
            placement="auto"
            onChange={value => updateFilter({deactivationReason: value})}
          />
        </FormGroup>
        <FormGroup style={{marginLeft: '15px'}}>
          <ControlLabel>{t('userSubscriptionEdit.payedUntil')}</ControlLabel>
          <DatePicker
            block
            value={paidUntil ?? undefined}
            onChange={value => {
              console.log('value', value)
              updateFilter({
                paidUntil: {date: value.toISOString(), comparison: DateFilterComparison.Lower}
              })
            }}
          />
        </FormGroup>
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
            setSortOrder(sortType)
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
                      icon={<Icon icon="trash" />}
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
          style={{height: '50px'}}
          lengthMenu={DEFAULT_TABLE_PAGE_SIZES}
          activePage={page}
          displayLength={limit}
          total={data?.subscriptions.totalCount}
          onChangePage={page => setPage(page)}
          onChangeLength={limit => setLimit(limit)}
        />
      </div>

      <Drawer
        show={isEditModalOpen}
        size={'sm'}
        onHide={() => {
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

      <Modal show={isExportModalOpen} onHide={() => setExportModalOpen(false)}>
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

      <Modal show={isConfirmationDialogOpen} onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('subscriptionList.panels.deleteSubscription')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {currentSubscription && isTempUser(currentSubscription.user?.id) && (
            <Message
              showIcon
              type="warning"
              description={t('subscriptionList.panels.tempUserWarning')}
            />
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
