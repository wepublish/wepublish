import React, {useState, useEffect} from 'react'
import {
  Typography,
  Box,
  Spacing,
  Divider,
  Drawer,
  OptionButton,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  DescriptionList,
  DescriptionListItem
} from '@karma.run/ui'

import {
  RouteLinkButton,
  Link,
  RouteType,
  useRoute,
  useRouteDispatch,
  PaymentMethodEditRoute,
  PaymentMethodCreateRoute,
  PaymentMethodListRoute
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {MaterialIconDeleteOutlined, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'
import {
  FullPaymentMethodFragment,
  useDeletePaymentMethodMutation,
  usePaymentMethodListQuery
} from '../api'

import {PaymentMethodEditPanel} from '../panel/paymentMethodEditPanel'

enum ConfirmAction {
  Delete = 'delete'
}

export function PaymentMethodList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.PaymentMethodEdit || current?.type === RouteType.PaymentMethodCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.PaymentMethodEdit ? current.params.id : undefined
  )

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<FullPaymentMethodFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const {data, loading: isLoading} = usePaymentMethodListQuery({
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

  const paymentMethods = data?.paymentMethods.map(paymentMethod => {
    const {id, name} = paymentMethod

    return (
      <Box key={id} display="block" marginBottom={Spacing.ExtraSmall}>
        <Box
          key={id}
          marginBottom={Spacing.ExtraSmall}
          display="flex"
          flexDirection="row"
          alignItems="center">
          <Link route={PaymentMethodEditRoute.create({id})}>
            <Typography variant="h3" color={name ? 'dark' : 'gray'}>
              {name || 'Unknown'}
            </Typography>
          </Link>

          <Box flexGrow={1} />
          <OptionButton
            position="left"
            menuItems={[
              {id: ConfirmAction.Delete, label: 'Delete', icon: MaterialIconDeleteOutlined}
            ]}
            onMenuItemClick={item => {
              setCurrentPaymentMethod(paymentMethod)
              setConfirmationDialogOpen(true)
              setConfirmAction(item.id as ConfirmAction)
            }}
          />
        </Box>
        <Divider />
      </Box>
    )
  })

  return (
    <>
      <Box marginBottom={Spacing.Small} flexDirection="row" display="flex">
        <Typography variant="h1">Payment Methods</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label="New Payment Method"
          route={PaymentMethodCreateRoute.create({})}
        />
      </Box>
      <Box>
        {paymentMethods?.length ? (
          <>{paymentMethods}</>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No Payment Methods found
          </Typography>
        ) : null}
      </Box>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <PaymentMethodEditPanel
            id={editID}
            onClose={() => {
              setEditModalOpen(false)
              dispatch({
                type: RouteActionType.PushRoute,
                route: PaymentMethodListRoute.create({}, current ?? undefined)
              })
            }}
            onSave={() => {
              setEditModalOpen(false)
              dispatch({
                type: RouteActionType.PushRoute,
                route: PaymentMethodListRoute.create({}, current ?? undefined)
              })
            }}
          />
        )}
      </Drawer>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title="Delete Payment Method"
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label="Cancel"
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label="Confirm"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!currentPaymentMethod) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deletePaymentMethod({
                          variables: {id: currentPaymentMethod.id}
                        })
                        break
                    }

                    setConfirmationDialogOpen(false)
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label="Name">
                  {currentPaymentMethod?.name || 'Unknown'}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
