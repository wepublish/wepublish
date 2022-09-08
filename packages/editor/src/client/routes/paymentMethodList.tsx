import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {Button, Drawer, FlexboxGrid, IconButton, Modal, Table} from 'rsuite'

import {
  FullPaymentMethodFragment,
  useDeletePaymentMethodMutation,
  usePaymentMethodListQuery
} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {PaymentMethodEditPanel} from '../panel/paymentMethodEditPanel'

const {Column, HeaderCell, Cell} = Table

export function PaymentMethodList() {
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
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <Link to="/paymentmethods/create">
            <Button appearance="primary" disabled={isLoading}>
              {t('paymentMethodList.createNew')}
            </Button>
          </Link>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight style={{marginTop: '20px'}} loading={isLoading} data={paymentMethods}>
        <Column width={200} align="left" resizable>
          <HeaderCell>{t('paymentMethodList.name')}</HeaderCell>
          <Cell>
            {(rowData: FullPaymentMethodFragment) => (
              <Link to={`/paymentmethods/edit/${rowData.id}`}>{rowData.name || t('untitled')}</Link>
            )}
          </Cell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('paymentMethodList.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullPaymentMethodFragment) => (
              <>
                <IconButtonTooltip caption={t('delete')}>
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
