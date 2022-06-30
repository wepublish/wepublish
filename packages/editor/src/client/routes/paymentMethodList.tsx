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

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {RouteActionType} from '@wepublish/karma.run-react'
import {
  FullPaymentMethodFragment,
  useDeletePaymentMethodMutation,
  usePaymentMethodListQuery
} from '../api'

import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

import {PaymentMethodEditPanel} from '../panel/paymentMethodEditPanel'
import {FlexboxGrid, IconButton, Drawer, Table, Modal, Button} from 'rsuite'
import {useTranslation} from 'react-i18next'
import TrashIcon from '@rsuite/icons/legacy/Trash'
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

      <Table autoHeight style={{marginTop: '20px'}} loading={isLoading} data={paymentMethods}>
        <Column width={200} align="left" resizable>
          <HeaderCell>{t('paymentMethodList.name')}</HeaderCell>
          <Cell>
            {(rowData: FullPaymentMethodFragment) => (
              <Link route={PaymentMethodEditRoute.create({id: rowData.id})}>
                {rowData.name || t('untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('paymentMethodList.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullPaymentMethodFragment) => (
              <>
                <IconButtonTooltip caption={t('paymentMethodList.delete')}>
                  <IconButton
                    icon={<TrashIcon />}
                    circle
                    size="sm"
                    style={{marginLeft: '5px'}}
                    onClick={() => {
                      setConfirmationDialogOpen(true)
                      setCurrentPaymentMethod(rowData)
                    }}
                  />
                </IconButtonTooltip>
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Drawer
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
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
      </Drawer>

      <Modal open={isConfirmationDialogOpen} size={'sm'}>
        <Modal.Header>
          <Modal.Title>{t('paymentMethodList.deleteModalTitle')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('paymentMethodList.name')}>
              {currentPaymentMethod?.name || t('untitled')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentPaymentMethod) return

              await deletePaymentMethod({
                variables: {id: currentPaymentMethod.id}
              })

              await refetch()
              setConfirmationDialogOpen(false)
            }}
            color="red">
            {t('confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
