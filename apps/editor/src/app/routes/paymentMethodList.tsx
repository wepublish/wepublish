import styled from '@emotion/styled'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd, MdDelete} from 'react-icons/md'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {
  Button,
  Drawer,
  FlexboxGrid,
  IconButton as RIconButton,
  Modal,
  Table as RTable
} from 'rsuite'
import {RowDataType} from 'rsuite-table'

import {
  FullPaymentMethodFragment,
  useDeletePaymentMethodMutation,
  usePaymentMethodListQuery
} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'
import {PaymentMethodEditPanel} from '../panel/paymentMethodEditPanel'

const {Column, HeaderCell, Cell: RCell} = RTable

const Cell = styled(RCell)`
  .rs-table-cell-content {
    padding: 6px 0;
  }
`

const Table = styled(RTable)`
  margin-top: 20px;
`

const GridItemAlignRight = styled(FlexboxGrid.Item)`
  text-align: right;
`

const IconButton = styled(RIconButton)`
  margin-left: 5px;
`

function PaymentMethodList() {
  const {t} = useTranslation()
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const {id} = params

  const isCreateRoute = location.pathname.includes('create')
  const isEditRoute = location.pathname.includes('edit')

  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute || isCreateRoute)

  const [editID, setEditID] = useState<string | undefined>(isEditRoute ? id : undefined)

  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<FullPaymentMethodFragment>()

  const {data, loading: isLoading, refetch} = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
  })

  const [deletePaymentMethod, {loading: isDeleting}] = useDeletePaymentMethodMutation()

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
        <PermissionControl qualifyingPermissions={['CAN_CREATE_PAYMENT_METHOD']}>
          <GridItemAlignRight colspan={8}>
            <Link to="/paymentmethods/create">
              <IconButton appearance="primary" disabled={isLoading} icon={<MdAdd />}>
                {t('paymentMethodList.createNew')}
              </IconButton>
            </Link>
          </GridItemAlignRight>
        </PermissionControl>
      </FlexboxGrid>

      <Table autoHeight loading={isLoading} data={paymentMethods}>
        <Column width={200} align="left" resizable>
          <HeaderCell>{t('paymentMethodList.name')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<FullPaymentMethodFragment>) => (
              <Link to={`/paymentmethods/edit/${rowData.id}`}>{rowData.name || t('untitled')}</Link>
            )}
          </RCell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('paymentMethodList.action')}</HeaderCell>
          <Cell>
            {(rowData: RowDataType<FullPaymentMethodFragment>) => (
              <PermissionControl qualifyingPermissions={['CAN_DELETE_PAYMENT_METHOD']}>
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    icon={<MdDelete />}
                    circle
                    appearance="ghost"
                    color="red"
                    size="sm"
                    onClick={() => {
                      setConfirmationDialogOpen(true)
                      setCurrentPaymentMethod(rowData)
                    }}
                  />
                </IconButtonTooltip>
              </PermissionControl>
            )}
          </Cell>
        </Column>
      </Table>

      <Drawer
        open={isEditModalOpen}
        size="sm"
        onClose={() => {
          setEditModalOpen(false)
          navigate('/paymentmethods')
        }}>
        <PaymentMethodEditPanel
          id={editID}
          onClose={async () => {
            setEditModalOpen(false)
            navigate('/paymentmethods')
            await refetch()
          }}
          onSave={async () => {
            setEditModalOpen(false)
            navigate('/paymentmethods')
            await refetch()
          }}
        />
      </Drawer>

      <Modal open={isConfirmationDialogOpen} size="sm">
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

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAYMENT_METHODS',
  'CAN_GET_PAYMENT_METHOD',
  'CAN_CREATE_PAYMENT_METHOD',
  'CAN_DELETE_PAYMENT_METHOD'
])(PaymentMethodList)
export {CheckedPermissionComponent as PaymentMethodList}
