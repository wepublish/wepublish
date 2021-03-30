import React, {useState, useEffect} from 'react'

import {
  Link,
  RouteType,
  useRoute,
  useRouteDispatch,
  PaymentMethodEditRoute,
  PaymentMethodCreateRoute,
  PaymentMethodListRoute,
  ButtonLink
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {
  FullPaymentMethodFragment,
  useDeletePaymentMethodMutation,
  usePaymentMethodListQuery
} from '../api'

import {PaymentMethodEditPanel} from '../panel/paymentMethodEditPanel'
import {FlexboxGrid, Icon, IconButton, Table, Modal, Button, Popover, Whisper} from 'rsuite'
import {useTranslation} from 'react-i18next'
const {Column, HeaderCell, Cell /*, Pagination */} = Table

export function PaymentMethodList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const {t} = useTranslation()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.PaymentMethodEdit || current?.type === RouteType.PaymentMethodCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.PaymentMethodEdit ? current.params.id : undefined
  )

  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<FullPaymentMethodFragment>()

  const {data, loading: isLoading, refetch} = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
  })

  const [deletePaymentMethod, {loading: isDeleting}] = useDeletePaymentMethodMutation()

  const speaker = (
    <Popover title={t('userList.popover.deleteThisUser')}>
      <p>{t('userList.popover.popoverText')}</p>
      <p>
        <Button
          color="red"
          disabled={isDeleting}
          onClick={async () => {
            if (!currentPaymentMethod) return

            await deletePaymentMethod({
              variables: {id: currentPaymentMethod.id}
            })

            await refetch()
            setConfirmationDialogOpen(false)
          }}>
          {t('userList.popover.deleteNow')}
        </Button>
      </p>
    </Popover>
  )

  useEffect(() => {
    switch (current?.type) {
      case RouteType.PaymentMethodCreate:
        setEditID(undefined)
        setEditModalOpen(true)
        break

      case RouteType.PaymentMethodEdit:
        setEditID(current.params.id)
        setEditModalOpen(true)
        break
    }
  }, [current])

  useEffect(() => {
    if (data?.paymentMethods) {
      setPaymentMethods(data.paymentMethods)
    }
  }, [data?.paymentMethods])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('paymentMethodList.title')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isLoading}
            route={PaymentMethodCreateRoute.create({})}>
            {t('paymentMethodList.createNew')}
          </ButtonLink>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table
        autoHeight={true}
        style={{marginTop: '20px'}}
        loading={isLoading}
        data={paymentMethods}>
        <Column flexGrow={6} align="left">
          <HeaderCell>{t('paymentMethodList.name')}</HeaderCell>
          <Cell>
            {(rowData: FullPaymentMethodFragment) => (
              <Link route={PaymentMethodEditRoute.create({id: rowData.id})}>
                {rowData.name || t('untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={60} align="right" fixed="right">
          <HeaderCell>{t('paymentMethodList.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullPaymentMethodFragment) => (
              <>
                <Whisper placement="leftEnd" trigger="click" speaker={speaker}>
                  <IconButton
                    icon={<Icon icon="trash-o" />}
                    circle
                    size="sm"
                    color="red"
                    onClick={() => {
                      setCurrentPaymentMethod(rowData)
                    }}
                  />
                </Whisper>
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Modal
        show={isEditModalOpen}
        size={'sm'}
        onHide={() => {
          setEditModalOpen(false)
          dispatch({
            type: RouteActionType.PushRoute,
            route: PaymentMethodListRoute.create({}, current ?? undefined)
          })
        }}>
        <PaymentMethodEditPanel
          id={editID}
          onClose={async () => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: PaymentMethodListRoute.create({}, current ?? undefined)
            })
            await refetch()
          }}
          onSave={async () => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: PaymentMethodListRoute.create({}, current ?? undefined)
            })
            await refetch()
          }}
        />
      </Modal>
    </>
  )
}
